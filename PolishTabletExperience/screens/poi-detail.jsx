import { useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Video } from 'expo-av';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MainColors, Typography } from '@/constants/theme';
import { POI_DETAILS } from '../constants/contentData';

function BackIcon({ size = 28, color = '#1C1B1F' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Path
        d="M27.0837 36.6666L10.417 19.9999L27.0837 3.33325L29.6253 5.90283L15.5282 19.9999L29.6253 34.097L27.0837 36.6666Z"
        fill={color}
      />
    </Svg>
  );
}

const DEFAULT_MAIN_ID = 'c1';

export default function POIDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentId = typeof params.id === 'string' ? params.id : DEFAULT_MAIN_ID;

  const mainPoi = POI_DETAILS[currentId] || POI_DETAILS[DEFAULT_MAIN_ID];
  const videoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMainVideoPlaying, setIsMainVideoPlaying] = useState(false);
  const [didMainVideoFinish, setDidMainVideoFinish] = useState(false);

  const [hasVideoStarted, setHasVideoStarted] = useState(false);
  const [videoStartPositionMillis, setVideoStartPositionMillis] = useState(0);
  const [videoStatus, setVideoStatus] = useState(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPreviewMillis, setSeekPreviewMillis] = useState(null);
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  const [isFsPlaying, setIsFsPlaying] = useState(false);
  const [fsVideoStatus, setFsVideoStatus] = useState(null);
  const [fsProgressBarWidth, setFsProgressBarWidth] = useState(1);
  const [fsStartPositionMillis, setFsStartPositionMillis] = useState(0);

  useEffect(() => {
    // When navigating between POIs, reset the "play" state.
    setIsMainVideoPlaying(false);
    setDidMainVideoFinish(false);
    setHasVideoStarted(false);
    setVideoStartPositionMillis(0);
    setVideoStatus(null);
    setIsSeeking(false);
    setSeekPreviewMillis(null);
    setProgressBarWidth(0);
  }, [currentId]);

  const relatedPois =
    (mainPoi.relatedIds || [])
      .map((id) => {
        const poi = POI_DETAILS[id];
        if (!poi) return null;
        return {
          id: poi.id,
          title: poi.titleTop,
          value: poi.yearLabel,
          description: poi.summary || poi.description,
          image: poi.mainImage,
          hasVideo: !!poi.mainVideo,
        };
      })
      .filter(Boolean) || [];

  const { width } = useWindowDimensions();
  const isWide = width >= 600;
  const contentFlex = isWide ? { flex: 0.65 } : null;
  const relatedFlex = isWide ? { flex: 0.35 } : null;

  const formatTime = (millis) => {
    const safe = Math.max(0, millis || 0);
    const totalSeconds = Math.floor(safe / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const durationMillis = videoStatus?.durationMillis ?? 0;
  const positionMillis = (isSeeking ? seekPreviewMillis : videoStatus?.positionMillis) ?? 0;
  const progress01 = durationMillis > 0 ? Math.min(Math.max(positionMillis / durationMillis, 0), 1) : 0;

  const handlePlay = async () => {
    setHasVideoStarted(true);
    if (didMainVideoFinish) {
      try {
        // @ts-expect-error expo-av runtime method
        await videoRef.current?.setPositionAsync?.(0);
      } catch {}
      setDidMainVideoFinish(false);
    }
    setIsMainVideoPlaying(true);
    try {
      // @ts-expect-error expo-av runtime method
      await videoRef.current?.playAsync?.();
    } catch {}
  };

  const handlePause = async () => {
    setIsMainVideoPlaying(false);
    try {
      // @ts-expect-error expo-av runtime method
      await videoRef.current?.pauseAsync?.();
    } catch {}
  };

  const handleCommitSeek = async (nextMillis) => {
    const bounded = Math.max(0, Math.min(nextMillis, durationMillis || nextMillis));
    setDidMainVideoFinish(false);
    setHasVideoStarted(true);
    setIsMainVideoPlaying(false);
    try {
      // @ts-expect-error expo-av runtime method
      await videoRef.current?.setPositionAsync?.(bounded);
    } catch {}
  };

  const getSeekMillisFromX = (x) => {
    if (!durationMillis) return 0;
    const next = (x / Math.max(progressBarWidth, 1)) * durationMillis;
    return Math.max(0, Math.min(next, durationMillis));
  };

  const fsDurationMillis = fsVideoStatus?.durationMillis ?? 0;
  const fsPositionMillis = fsVideoStatus?.positionMillis ?? 0;
  const fsProgress01 = fsDurationMillis > 0 ? Math.min(Math.max(fsPositionMillis / fsDurationMillis, 0), 1) : 0;

  const openFullscreen = async () => {
    const pos = videoStatus?.positionMillis ?? videoStartPositionMillis;
    try { await videoRef.current?.pauseAsync?.(); } catch {}
    setIsMainVideoPlaying(false);
    setFsVideoStatus(null);
    setFsStartPositionMillis(pos);
    setIsFsPlaying(false);
    setIsFullscreen(true);
  };

  const closeFullscreen = async () => {
    const pos = fsVideoStatus?.positionMillis ?? fsStartPositionMillis;
    try { await fullscreenVideoRef.current?.pauseAsync?.(); } catch {}
    setIsFsPlaying(false);
    setVideoStartPositionMillis(pos);
    setIsMainVideoPlaying(false);
    try { await videoRef.current?.setPositionAsync?.(pos); } catch {}
    setIsFullscreen(false);
  };

  const handleFsPlay = async () => {
    try { await fullscreenVideoRef.current?.playAsync?.(); } catch {}
    setIsFsPlaying(true);
  };

  const handleFsPause = async () => {
    try { await fullscreenVideoRef.current?.pauseAsync?.(); } catch {}
    setIsFsPlaying(false);
  };

  const handleFsSeek = async (x) => {
    if (!fsDurationMillis) return;
    const bounded = Math.max(0, Math.min((x / Math.max(fsProgressBarWidth, 1)) * fsDurationMillis, fsDurationMillis));
    try {
      await fullscreenVideoRef.current?.setPositionAsync?.(bounded);
    } catch {}
    setIsFsPlaying(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <BackIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isWide && styles.row]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isSeeking}
      >
        <View style={[styles.mainContent, contentFlex]}>
          <View style={styles.imagePlaceholder}>
            {mainPoi.mainImage ? (
              <Image source={mainPoi.mainImage} style={styles.mainImage} contentFit="cover" />
            ) : null}

            {mainPoi.mainVideo ? (
              <View style={styles.videoWrapper}>
                <View style={styles.videoClip} pointerEvents="none">
                  <Video
                    key={currentId}
                    ref={(node) => {
                      videoRef.current = node;
                    }}
                    source={mainPoi.mainVideo}
                    style={styles.mainVideo}
                    resizeMode="contain"
                    // On web, styles often apply to the wrapper, not the <video> element.
                    // Without objectFit, the video can look "zoomed" (only top-left visible).
                    // @ts-expect-error expo-av web-only prop
                    videoStyle={
                      Platform.OS === 'web'
                        ? { width: '100%', height: '100%', objectFit: 'contain', position: 'relative' }
                        : undefined
                    }
                    useNativeControls={false}
                    isLooping={false}
                    shouldPlay={false}
                    positionMillis={videoStartPositionMillis}
                    onPlaybackStatusUpdate={(status) => {
                      // @ts-expect-error - expo-av types vary between versions.
                      if (!status?.isLoaded) return;
                      setVideoStatus(status);
                      setIsMainVideoPlaying(!!status.isPlaying);
                      if (status.didJustFinish) {
                        setDidMainVideoFinish(true);
                        setIsMainVideoPlaying(false);
                      }
                    }}
                  />
                </View>

                {!hasVideoStarted ? (
                  <TouchableOpacity style={styles.playButton} activeOpacity={0.85} onPress={handlePlay}>
                    <View style={styles.playButtonCircle}>
                      <Text style={styles.playButtonText}>▶</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}

                {hasVideoStarted ? (
                  <View style={styles.controlsBar} pointerEvents="box-none">
                    <View style={styles.controlsRow}>
                      <TouchableOpacity
                        style={styles.controlButton}
                        activeOpacity={0.85}
                        onPress={() => {
                          if (isMainVideoPlaying) return handlePause();
                          return handlePlay();
                        }}
                      >
                        <Text style={styles.controlButtonText}>
                          {isMainVideoPlaying ? '❚❚' : '▶'}
                        </Text>
                      </TouchableOpacity>

                      <View
                        style={styles.progressArea}
                        onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
                      >
                        <View
                          style={styles.progressBar}
                          onStartShouldSetResponder={() => true}
                          onResponderRelease={(e) => {
                            if (!durationMillis) return;
                            const x = e.nativeEvent.locationX ?? 0;
                            const next = getSeekMillisFromX(x);
                            setIsSeeking(false);
                            setSeekPreviewMillis(null);
                            setDidMainVideoFinish(false);
                            handleCommitSeek(next);
                          }}
                        >
                          <View style={[styles.progressFill, { width: `${progress01 * 100}%` }]} />
                          <View style={[styles.progressThumb, { left: `${progress01 * 100}%` }]} />
                        </View>
                      </View>

                      <Text style={styles.timeText}>
                        {formatTime(positionMillis)} / {formatTime(durationMillis)}
                      </Text>

                      <TouchableOpacity
                        style={styles.controlButton}
                        activeOpacity={0.85}
                        onPress={openFullscreen}
                      >
                        <Text style={styles.controlButtonText}>⤢</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.poiTitle}>{mainPoi.titleTop}</Text>
            <Text style={styles.poiValue}>{mainPoi.yearLabel}</Text>
          </View>
          <Text style={styles.description}>{mainPoi.description}</Text>
        </View>

        <View style={[styles.relatedSection, relatedFlex]}>
          <Text style={styles.relatedTitle}>Related Content</Text>
          {relatedPois.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.relatedCard}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: '/poi-detail',
                  params: { id: item.id },
                })
              }
            >
              <View style={styles.relatedImagePlaceholder}>
                {item.image ? (
                  <Image source={item.image} style={styles.relatedImage} contentFit="cover" />
                ) : null}
                {item.hasVideo ? (
                  <View style={styles.relatedPlayOverlay} pointerEvents="none">
                    <Text style={styles.relatedPlayText}>▶</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.relatedCardContent}>
                <View style={styles.relatedTitleRow}>
                  <Text style={styles.relatedCardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.relatedCardValue}>{item.value}</Text>
                </View>
                <Text style={styles.relatedCardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {mainPoi.mainVideo ? (
        <Modal
          visible={isFullscreen}
          transparent={false}
          animationType="fade"
          onRequestClose={closeFullscreen}
          statusBarTranslucent
        >
          <View style={styles.fsContainer}>
            <Video
              ref={(node) => { fullscreenVideoRef.current = node; }}
              source={mainPoi.mainVideo}
              style={styles.fsVideo}
              resizeMode="contain"
              // @ts-expect-error expo-av web-only prop
              videoStyle={
                Platform.OS === 'web'
                  ? { width: '100%', height: '100%', objectFit: 'contain', position: 'relative' }
                  : undefined
              }
              useNativeControls={false}
              isLooping={false}
              shouldPlay={false}
              positionMillis={fsStartPositionMillis}
              onPlaybackStatusUpdate={(status) => {
                // @ts-expect-error
                if (!status?.isLoaded) return;
                setFsVideoStatus(status);
                setIsFsPlaying(!!status.isPlaying);
                if (status.didJustFinish) setIsFsPlaying(false);
              }}
            />
            <View style={styles.fsControlsBar}>
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={styles.controlButton}
                  activeOpacity={0.85}
                  onPress={() => isFsPlaying ? handleFsPause() : handleFsPlay()}
                >
                  <Text style={styles.controlButtonText}>
                    {isFsPlaying ? '❚❚' : '▶'}
                  </Text>
                </TouchableOpacity>

                <View
                  style={styles.progressArea}
                  onLayout={(e) => setFsProgressBarWidth(e.nativeEvent.layout.width)}
                >
                  <View
                    style={styles.progressBar}
                    onStartShouldSetResponder={() => true}
                    onResponderRelease={(e) => {
                      const x = e.nativeEvent.locationX ?? 0;
                      handleFsSeek(x);
                    }}
                  >
                    <View style={[styles.progressFill, { width: `${fsProgress01 * 100}%` }]} />
                    <View style={[styles.progressThumb, { left: `${fsProgress01 * 100}%` }]} />
                  </View>
                </View>

                <Text style={styles.timeText}>
                  {formatTime(fsPositionMillis)} / {formatTime(fsDurationMillis)}
                </Text>

                <TouchableOpacity
                  style={styles.controlButton}
                  activeOpacity={0.85}
                  onPress={closeFullscreen}
                >
                  <Text style={styles.controlButtonText}>⤡</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MainColors.backgroundGrey,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  mainContent: {
    marginBottom: 24,
    // marginRight: 20,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: MainColors.secondaryGrey,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  mainVideo: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.04 }],
  },
  videoWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  videoClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  playButtonCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    marginLeft: 4,
  },
  controlsBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.38)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    zIndex: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 1,
  },
  progressArea: {
    flex: 1,
  },
  progressBar: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  progressThumb: {
    position: 'absolute',
    top: 0,
    width: 14,
    height: 14,
    marginTop: -1,
    borderRadius: 7,
    backgroundColor: '#fff',
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    width: 92,
    textAlign: 'right',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  poiTitle: {
    ...Typography.h4,
    color: MainColors.primaryBlack,
    flex: 1,
  },
  poiValue: {
    ...Typography.h4,
    color: MainColors.primaryBlack,
  },
  description: {
    ...Typography.body,
    color: MainColors.primaryBlack,
  },
  relatedSection: {
    minWidth: 280,
    marginLeft: 20,
  },
  relatedTitle: {
    ...Typography.h4,
    color: MainColors.primaryBlack,
    marginBottom: 16,
  },
  relatedCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
    minHeight: 150,
  },
  relatedImagePlaceholder: {
    width: 200,
    height: 150,
    backgroundColor: MainColors.secondaryGrey,
    position: 'relative',
  },
  relatedImage: {
    width: '100%',
    height: '100%',
  },
  relatedPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  relatedPlayText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginLeft: 3,
  },
  relatedCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  relatedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  relatedCardTitle: {
    ...Typography.h6,
    color: MainColors.primaryBlack,
    flex: 1,
  },
  relatedCardValue: {
    ...Typography.small,
    color: MainColors.primaryBlack,
  },
  relatedCardDesc: {
    ...Typography.small,
    color: MainColors.textGrey,
  },
  fsContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fsVideo: {
    width: '100%',
    height: '100%',
  },
  fsControlsBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});

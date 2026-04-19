import React, { useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from 'react-native-gesture-handler';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const { width: SCREEN_W } = Dimensions.get('window');
const MAP_HEIGHT = 420;

/**
 * Мемоизированная страна — не перерисовывается пока не меняется fill.
 * Критично для производительности: при жестах перерисовывается только
 * внешний transform, а сами <Path> React трогать не будет.
 */
const CountryPath = memo(
  ({ d, fill, onPressId, id, name }) => (
    <Path
      d={d}
      fill={fill}
      stroke="#999"
      strokeWidth={0.5}
      onPress={() => onPressId(id, name)}
    />
  ),
  (prev, next) => prev.fill === next.fill && prev.d === next.d
);

function WorldMapSvgInner({ getFill, onCountryPress }) {
  const [features, setFeatures] = useState(null);
  const [error, setError] = useState(null);

  // Accumulated values (стабильная часть transform)
  const [baseTx, setBaseTx] = useState(0);
  const [baseTy, setBaseTy] = useState(0);
  const [baseScale, setBaseScale] = useState(1);

  // Animated values для активного жеста
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const pinch = useRef(new Animated.Value(1)).current;

  // Рефы для simultaneousHandlers
  const panRef = useRef();
  const pinchRef = useRef();

  useEffect(() => {
    fetch(GEO_URL)
      .then((r) => r.json())
      .then((topo) => {
        const geo = feature(topo, topo.objects.countries).features;
        setFeatures(geo);
      })
      .catch((e) => {
        console.warn('World map load error:', e);
        setError(e.message);
      });
  }, []);

  const { paths, width, height } = useMemo(() => {
    const w = SCREEN_W;
    const h = MAP_HEIGHT;
    const projection = geoMercator()
      .scale(w / 6.3)
      .translate([w / 2, h / 1.5]);
    const pathGen = geoPath(projection);

    if (!features) return { paths: [], width: w, height: h };
    const result = features
      .map((f) => {
        const d = pathGen(f);
        if (!d) return null;
        return { id: f.id, name: f.properties?.name || '', d };
      })
      .filter(Boolean);

    return { paths: result, width: w, height: h };
  }, [features]);

  // PAN handlers
  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: panX, translationY: panY } }],
    { useNativeDriver: true }
  );

  const onPanStateChange = (e) => {
    if (e.nativeEvent.state === State.END || e.nativeEvent.state === State.CANCELLED) {
      setBaseTx((v) => v + e.nativeEvent.translationX);
      setBaseTy((v) => v + e.nativeEvent.translationY);
      panX.setValue(0);
      panY.setValue(0);
    }
  };

  // PINCH handlers
  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinch } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = (e) => {
    if (e.nativeEvent.state === State.END || e.nativeEvent.state === State.CANCELLED) {
      setBaseScale((v) => Math.max(1, Math.min(12, v * e.nativeEvent.scale)));
      pinch.setValue(1);
    }
  };

  const resetZoom = () => {
    setBaseTx(0);
    setBaseTy(0);
    setBaseScale(1);
  };

  // Объединяем накопленное значение с активным жестом
  const translateXCombined = Animated.add(panX, baseTx);
  const translateYCombined = Animated.add(panY, baseTy);
  const scaleCombined = Animated.multiply(pinch, baseScale);

  if (error) {
    return (
      <View style={[styles.wrapper, styles.center]}>
        <Text style={{ color: '#c62828' }}>Ошибка загрузки карты</Text>
        <Text style={{ color: '#999', fontSize: 12 }}>{error}</Text>
      </View>
    );
  }

  if (!features) {
    return (
      <View style={[styles.wrapper, styles.center]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: '#666' }}>Загружаю карту мира...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <PanGestureHandler
        ref={panRef}
        simultaneousHandlers={pinchRef}
        minPointers={1}
        maxPointers={2}
        onGestureEvent={onPanEvent}
        onHandlerStateChange={onPanStateChange}
      >
        <Animated.View style={styles.container}>
          <PinchGestureHandler
            ref={pinchRef}
            simultaneousHandlers={panRef}
            onGestureEvent={onPinchEvent}
            onHandlerStateChange={onPinchStateChange}
          >
            <Animated.View
              style={[
                styles.container,
                {
                  transform: [
                    { translateX: translateXCombined },
                    { translateY: translateYCombined },
                    { scale: scaleCombined },
                  ],
                },
              ]}
            >
              <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <G>
                  {paths.map((p) => (
                    <CountryPath
                      key={p.id}
                      id={p.id}
                      name={p.name}
                      d={p.d}
                      fill={getFill(p.id)}
                      onPressId={onCountryPress}
                    />
                  ))}
                </G>
              </Svg>
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>

      <TouchableOpacity style={styles.resetBtn} onPress={resetZoom}>
        <Text style={styles.resetTxt}>⊙</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function WorldMapSvg(props) {
  return (
    <GestureHandlerRootView style={styles.wrapper}>
      <WorldMapSvgInner {...props} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SCREEN_W,
    height: MAP_HEIGHT,
    backgroundColor: '#eaf6ff',
    overflow: 'hidden',
  },
  container: {
    width: SCREEN_W,
    height: MAP_HEIGHT,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  resetBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  resetTxt: { fontSize: 20, color: '#333' },
});

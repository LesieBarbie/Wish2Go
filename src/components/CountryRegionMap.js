import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { geoMercator, geoAlbersUsa, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

const { width: SCREEN_W } = Dimensions.get('window');
const MAP_HEIGHT = 380;

/**
 * Дістає назву регіону з properties - перебираємо поширені варіанти.
 * Різні джерела GeoJSON використовують різні ключі.
 */
function getRegionName(feature, index) {
  const p = feature.properties || {};
  return (
    p.name ||
    p.NAME ||
    p.NAME_1 ||
    p.shapeName || // geoBoundaries
    p.nom ||       // French
    p.NAME_EN ||
    p.name_en ||
    `region-${index}`
  );
}

/**
 * Детальна карта країни з регіонами.
 */
export default function CountryRegionMap({ config, visitedRegions, onRegionPress, countryId }) {
  const [features, setFeatures] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setFeatures(null);
    setError(null);

    const loadData = async () => {
      try {
        // Для geoBoundaries потрібен 2-кроковий процес:
        // 1) отримати метадані (де є поле simplifiedGeometryGeoJSON)
        // 2) завантажити сам geojson за цим посиланням
        if (config.isGeoboundaries) {
          const metaRes = await fetch(config.url);
          if (!metaRes.ok) throw new Error(`HTTP ${metaRes.status} (meta)`);
          const meta = await metaRes.json();
          const geojsonUrl = meta.simplifiedGeometryGeoJSON || meta.gjDownloadURL;
          if (!geojsonUrl) throw new Error('geoBoundaries: geojson URL not found');

          const geoRes = await fetch(geojsonUrl);
          if (!geoRes.ok) throw new Error(`HTTP ${geoRes.status} (geo)`);
          const geoData = await geoRes.json();
          setFeatures(geoData.features || []);
          return;
        }

        const res = await fetch(config.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // TopoJSON — розпаковуємо
        if (config.topojsonObject) {
          const obj = data.objects?.[config.topojsonObject];
          if (!obj) throw new Error(`TopoJSON object "${config.topojsonObject}" not found`);
          const geo = feature(data, obj);
          setFeatures(geo.features || []);
        } else {
          setFeatures(data.features || []);
        }
      } catch (e) {
        console.warn('Region map load error:', e);
        setError(e.message || 'Unknown error');
      }
    };

    loadData();
  }, [config.url, config.topojsonObject, config.isGeoboundaries]);

  const { pathGen, width, height } = useMemo(() => {
    const w = SCREEN_W - 20;
    const h = MAP_HEIGHT;

    // Для США — спеціальна проекція Albers USA
    if (countryId === '840') {
      const projection = geoAlbersUsa()
        .scale(w * 1.2)
        .translate([w / 2, h / 2]);
      return { pathGen: geoPath(projection), width: w, height: h };
    }

    const adjustedScale = (config.scale * w) / 800;
    const projection = geoMercator()
      .center(config.center)
      .scale(adjustedScale)
      .translate([w / 2, h / 2]);
    return { pathGen: geoPath(projection), width: w, height: h };
  }, [config, countryId]);

  const paths = useMemo(() => {
    if (!features) return [];
    return features
      .map((f, i) => {
        const name = getRegionName(f, i);
        const d = pathGen(f);
        if (!d) return null;
        return { name, d, key: `${name}-${i}` };
      })
      .filter(Boolean);
  }, [features, pathGen]);

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.err}>Не вдалося завантажити карту</Text>
        <Text style={styles.errSmall}>{error}</Text>
      </View>
    );
  }

  if (!features) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadTxt}>Завантажую карту регіонів...</Text>
      </View>
    );
  }

  if (paths.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.err}>Регіони не знайдено</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <G>
          {paths.map((p) => {
            const isVisited = visitedRegions.includes(p.name);
            return (
              <Path
                key={p.key}
                d={p.d}
                fill={isVisited ? '#69e36a' : '#d6d6d6'}
                stroke="#fff"
                strokeWidth={0.8}
                onPress={() => onRegionPress?.(p.name)}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W - 20,
    height: MAP_HEIGHT,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadTxt: { marginTop: 10, color: '#666' },
  err: { color: '#c62828', fontWeight: '600', marginBottom: 6 },
  errSmall: { color: '#999', fontSize: 12, paddingHorizontal: 20, textAlign: 'center' },
});

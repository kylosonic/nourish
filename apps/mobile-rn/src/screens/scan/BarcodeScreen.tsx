import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { border, colors, radii, spacing, type } from '../../theme';
import { Button, Icon } from '../../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Barcode'>;

export function BarcodeScreen({ navigation, route }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<string | null>(null);
  const slot = route.params?.slot;

  return (
    <View style={styles.page}>
      {Platform.OS !== 'web' && permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
          }}
          onBarcodeScanned={scanned ? undefined : ({ data }) => setScanned(data)}
        />
      ) : (
        <View style={styles.noCamera}>
          <Icon name="barcode-scan" size={46} color={colors.white} />
          <Text style={styles.noCameraText}>Use the camera on Android or iOS.</Text>
          {Platform.OS !== 'web' && !permission?.granted ? (
            <Button label="ALLOW CAMERA" onPress={requestPermission} />
          ) : null}
        </View>
      )}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close barcode scanner"
          onPress={() => navigation.goBack()}
          style={styles.close}
        >
          <Icon name="close" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Scan barcode</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.scanWindow}>
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
        <View style={styles.laser} />
      </View>
      <Text style={styles.hint}>Center the barcode inside the frame</Text>

      {scanned ? (
        <View style={styles.resultScrim}>
          <View style={styles.result}>
            <View style={styles.resultIcon}>
              <Icon name="package-variant-closed-remove" size={32} color={colors.error} />
            </View>
            <Text style={styles.resultTitle}>No verified product found</Text>
            <Text style={styles.resultCopy}>
              {scanned} isn’t in the verified catalog.
            </Text>
            <Button
              label="SCAN AGAIN"
              onPress={() => setScanned(null)}
              style={{ alignSelf: 'stretch', marginTop: spacing.lg }}
            />
            <Button
              label="SEARCH MANUALLY"
              variant="secondary"
              onPress={() => navigation.replace('FoodSearch', { slot })}
              style={{ alignSelf: 'stretch', marginTop: spacing.sm }}
            />
            <Text style={styles.honest}>Packaged-food OCR isn’t available yet.</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.charcoal },
  header: {
    position: 'absolute',
    top: 54,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, ...type.title, color: colors.white, textAlign: 'center' },
  scanWindow: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: '32%',
    height: '28%',
    justifyContent: 'center',
  },
  corner: { position: 'absolute', width: 42, height: 42, borderColor: colors.white },
  tl: { left: 0, top: 0, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 10 },
  tr: { right: 0, top: 0, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 10 },
  bl: { left: 0, bottom: 0, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 10 },
  br: { right: 0, bottom: 0, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 10 },
  laser: { height: border.standard, backgroundColor: colors.activeLime },
  hint: {
    ...type.body,
    position: 'absolute',
    top: '64%',
    alignSelf: 'center',
    color: colors.white,
  },
  noCamera: {
    flex: 1,
    backgroundColor: colors.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  noCameraText: { ...type.body, color: colors.white, textAlign: 'center' },
  resultScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  result: {
    backgroundColor: colors.pinkCanvas,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    padding: spacing.xl,
    alignItems: 'center',
  },
  resultIcon: {
    width: 66,
    height: 66,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.coralCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: { ...type.title, marginTop: spacing.md },
  resultCopy: { ...type.body, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xs },
  honest: { ...type.caption, textAlign: 'center', marginTop: spacing.md },
});

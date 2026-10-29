import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { border, colors, radii, spacing, type } from '../../theme';
import { Button, Icon } from '../../components/ui';
import {
  ApiError,
  lookupBarcode,
  parseNutritionLabel,
  type BarcodeFood,
} from '../../data/api';
import { useApp } from '../../state/AppProvider';
import type { Food } from '../../types';
import { useEntitlements } from '../../state/EntitlementProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Barcode'>;

export function BarcodeScreen({ navigation, route }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<string | null>(null);
  const [product, setProduct] = useState<BarcodeFood | null>(null);
  const [busy, setBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const slot = route.params?.slot;
  const { addDraftMeal } = useApp();
  const { entitlement } = useEntitlements();

  const resolveBarcode = async (barcode: string) => {
    if (busy) return;
    setScanned(barcode);
    setProduct(null);
    setLookupError(null);
    setBusy(true);
    try {
      setProduct(await lookupBarcode(barcode));
    } catch (error) {
      setLookupError(
        error instanceof ApiError && error.code === 'PRODUCT_NOT_FOUND'
          ? 'This barcode is not in the verified packaged-food catalog.'
          : 'The packaged-food catalog is unavailable right now.',
      );
    } finally {
      setBusy(false);
    }
  };

  const scanLabel = async () => {
    setBusy(true);
    setLookupError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.65,
        base64: true,
        allowsEditing: false,
      });
      const asset = result.canceled ? null : result.assets[0];
      if (!asset?.base64) return;
      const label = await parseNutritionLabel(
        asset.base64,
        asset.mimeType?.includes('png') ? 'image/png' : 'image/jpeg',
      );
      const factor = 100 / label.servingSizeG;
      const food: BarcodeFood = {
        id: `label:${Date.now().toString(36)}`,
        barcode: scanned ?? 'label',
        canonicalName: label.name || 'Label-scanned food',
        category: 'Packaged food',
        defaultPortion: {
          unit: 'serving',
          quantity: 1,
          grams: label.servingSizeG,
        },
        portions: [
          { unit: 'serving', quantity: 1, grams: label.servingSizeG },
          { unit: 'gram', quantity: 100, grams: 100 },
        ],
        per100g: {
          kcal: label.perServing.kcal * factor,
          proteinG: label.perServing.proteinG * factor,
          carbsG: label.perServing.carbsG * factor,
          fatG: label.perServing.fatG * factor,
        },
        aliases: [],
        sourceName: 'Nutrition label OCR',
        sourceVersion: 'gemini-2.5-flash',
      };
      setProduct(food);
    } catch (error) {
      setLookupError(
        error instanceof Error
          ? error.message
          : 'The nutrition label could not be read.',
      );
    } finally {
      setBusy(false);
    }
  };

  const addProduct = (food: Food) => {
    addDraftMeal(
      slot ?? 'other',
      [
        {
          food,
          unit: food.defaultPortion.unit,
          quantity: food.defaultPortion.quantity,
        },
      ],
      'manual',
    );
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
    });
  };

  return (
    <View style={styles.page}>
      {Platform.OS !== 'web' && permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
          }}
          onBarcodeScanned={
            scanned || busy
              ? undefined
              : ({ data }) => void resolveBarcode(data)
          }
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

      {scanned || busy ? (
        <View style={styles.resultScrim}>
          <View style={styles.result}>
            {busy ? (
              <>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.resultTitle}>Checking the label</Text>
                <Text style={styles.resultCopy}>
                  Looking up verified packaged-food nutrition.
                </Text>
              </>
            ) : product ? (
              <>
                <View style={styles.resultIcon}>
                  <Icon name="package-variant" size={32} color={colors.primary} />
                </View>
                <Text style={styles.resultTitle}>{product.canonicalName}</Text>
                <Text style={styles.resultCopy}>
                  {Math.round(product.per100g.kcal)} kcal / 100 g ·{' '}
                  {Math.round(product.per100g.proteinG)}g protein ·{' '}
                  {Math.round(product.per100g.carbsG)}g carbs ·{' '}
                  {Math.round(product.per100g.fatG)}g fat
                </Text>
                <Text style={styles.honest}>
                  One serving is {Math.round(product.defaultPortion.grams)} g.
                  Confirm the portion after adding it.
                </Text>
                <Button
                  label="ADD THIS PRODUCT"
                  onPress={() => addProduct(product)}
                  style={{ alignSelf: 'stretch', marginTop: spacing.lg }}
                />
                <Button
                  label="SCAN AGAIN"
                  variant="secondary"
                  onPress={() => {
                    setScanned(null);
                    setProduct(null);
                  }}
                  style={{ alignSelf: 'stretch', marginTop: spacing.sm }}
                />
              </>
            ) : (
              <>
                <View style={styles.resultIcon}>
                  <Icon
                    name="package-variant-closed-remove"
                    size={32}
                    color={colors.error}
                  />
                </View>
                <Text style={styles.resultTitle}>No verified product found</Text>
                <Text style={styles.resultCopy}>{lookupError}</Text>
                <Button
                  label={entitlement.isPro ? 'SCAN NUTRITION LABEL' : 'UNLOCK LABEL OCR'}
                  icon="text-recognition"
                  onPress={() =>
                    entitlement.isPro
                      ? void scanLabel()
                      : navigation.navigate('Paywall')
                  }
                  style={{ alignSelf: 'stretch', marginTop: spacing.lg }}
                />
                <Button
                  label="SCAN AGAIN"
                  variant="secondary"
                  onPress={() => {
                    setScanned(null);
                    setProduct(null);
                  }}
                  style={{ alignSelf: 'stretch', marginTop: spacing.sm }}
                />
                <Button
                  label="SEARCH MANUALLY"
                  variant="outline"
                  onPress={() => navigation.replace('FoodSearch', { slot })}
                  style={{ alignSelf: 'stretch', marginTop: spacing.sm }}
                />
                <Text style={styles.honest}>
                  Missing values are never estimated.
                </Text>
              </>
            )}
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

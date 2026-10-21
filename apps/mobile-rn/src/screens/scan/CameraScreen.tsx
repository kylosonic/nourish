import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts, radii, spacing } from '../../theme';
import { Icon } from '../../components/ui';
import { images } from '../../data/images';
import { setPendingAnalysisInput } from '../../state/analysisSession';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

export function CameraScreen({ navigation, route }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');

  const analyzeCapture = (base64: string, uri: string) => {
    setPendingAnalysisInput({ imageBase64: base64, imageUri: uri, slot: route.params?.slot });
    navigation.replace('Analysis', { slot: route.params?.slot, imageUri: uri });
  };

  const pickPhoto = async () => {
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.65,
        base64: true,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]?.base64) {
        analyzeCapture(result.assets[0].base64, result.assets[0].uri);
      }
    } catch {
      Alert.alert('Couldn’t open photos', 'Check photo permissions and try again.');
    } finally {
      setBusy(false);
    }
  };

  const capture = async () => {
    if (Platform.OS === 'web') {
      await pickPhoto();
      return;
    }
    if (!permission?.granted) {
      const response = await requestPermission();
      if (!response.granted) {
        Alert.alert(
          'Camera access needed',
          'Allow camera access to photograph your meal, or choose a photo from your library.',
          [
            { text: 'Choose photo', onPress: () => void pickPhoto() },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        return;
      }
    }
    setBusy(true);
    try {
      const photo = await camera.current?.takePictureAsync({
        quality: 0.65,
        base64: true,
        skipProcessing: false,
        exif: false,
      });
      if (!photo?.base64) throw new Error('The camera did not return an image.');
      analyzeCapture(photo.base64, photo.uri);
    } catch (error) {
      Alert.alert(
        'Couldn’t take the photo',
        error instanceof Error ? error.message : 'Try again or choose a photo from your library.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.page}>
      {Platform.OS !== 'web' && permission?.granted ? (
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing={facing}
          enableTorch={flash}
        />
      ) : (
        <Image source={images.camera} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}
      <View style={styles.topOverlay}>
        <Pressable
          accessibilityLabel="Close camera"
          onPress={() => navigation.goBack()}
          style={styles.glassButton}
        >
          <Icon name="close" size={24} color={colors.white} />
        </Pressable>
        <View style={styles.instruction}>
          <Icon name="focus-field" size={16} color={colors.white} />
          <Text style={styles.instructionText}>Fit your whole meal in the frame</Text>
        </View>
        <Pressable
          accessibilityLabel="Toggle flash"
          onPress={() => setFlash((value) => !value)}
          style={styles.glassButton}
        >
          <Icon name={flash ? 'flash' : 'flash-off'} size={22} color={colors.white} />
        </Pressable>
      </View>
      <View style={styles.frame} pointerEvents="none">
        <View style={[styles.corner, styles.cornerTopLeft]} />
        <View style={[styles.corner, styles.cornerTopRight]} />
        <View style={[styles.corner, styles.cornerBottomLeft]} />
        <View style={[styles.corner, styles.cornerBottomRight]} />
        <View style={styles.reticle} />
      </View>
      <View style={styles.bottomOverlay}>
        <Pressable
          accessibilityLabel="Choose a photo"
          onPress={pickPhoto}
          disabled={busy}
          style={styles.gallery}
        >
          <Image source={images.cameraFallback} style={StyleSheet.absoluteFill} />
        </Pressable>
        <Pressable
          accessibilityLabel="Take photo"
          onPress={capture}
          disabled={busy}
          style={styles.shutterOuter}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </Pressable>
        <Pressable
          accessibilityLabel="Switch camera"
          onPress={() => setFacing((value) => (value === 'back' ? 'front' : 'back'))}
          style={styles.glassButton}
        >
          <Icon name="camera-flip-outline" size={23} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.black },
  topOverlay: {
    position: 'absolute',
    top: 52,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instruction: {
    flex: 1,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  instructionText: { fontFamily: fonts.regular, fontSize: 13, color: colors.white },
  frame: {
    position: 'absolute',
    left: '15%',
    right: '15%',
    top: '24%',
    height: '44%',
  },
  corner: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  cornerTopLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  cornerTopRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  reticle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 48,
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gallery: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.white,
  },
  shutterOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
  },
});

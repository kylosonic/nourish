import type { ImageSourcePropType } from 'react-native';
import type { Food } from '../types';

export const images = {
  welcome: require('../../assets/images/welcome_screen-01.jpg'),
  analysis: require('../../assets/images/ai_analysis_screen-01.jpg'),
  result: require('../../assets/images/ai_result_screen-01.jpg'),
  camera: require('../../assets/images/camera_screen-01.jpg'),
  cameraFallback: require('../../assets/images/camera_screen-02.jpg'),
  dailyTarget: require('../../assets/images/daily_target_summary-01.jpg'),
  scanMenu: require('../../assets/images/scan_menu-01.jpg'),
  breakfast: require('../../assets/images/home_screen-01.jpg'),
  lunch: require('../../assets/images/home_screen-02.jpg'),
  dinner: require('../../assets/images/home_screen-03.jpg'),
  chechebsa: require('../../assets/images/meal_history_log-01.jpg'),
  shiro: require('../../assets/images/meal_history_log-02.jpg'),
  buna: require('../../assets/images/meal_history_log-03.jpg'),
  foodPattern: require('../../assets/images/food_search-01.jpg'),
  preferenceEthiopian: require('../../assets/images/food_preference-01.jpg'),
  preferenceMixed: require('../../assets/images/food_preference-02.jpg'),
  preferenceInternational: require('../../assets/images/food_preference-03.jpg'),
  candidateShiro: require('../../assets/images/low_confidence_state-02.jpg'),
  candidateMisir: require('../../assets/images/low_confidence_state-03.jpg'),
  candidateKik: require('../../assets/images/low_confidence_state-04.jpg'),
};

const foodImages: Record<string, ImageSourcePropType> = {
  injera: images.result,
  doro_wot: images.lunch,
  shiro_wot: images.shiro,
  misir_wot: images.candidateMisir,
  kik_alicha: images.candidateKik,
  beef_tibs: images.dinner,
  chechebsa: images.chechebsa,
  buna: images.buna,
  gomen: images.preferenceEthiopian,
  atkilt: images.preferenceMixed,
  orange: images.foodPattern,
};

export function imageForFood(food?: Pick<Food, 'id' | 'category'> | null): ImageSourcePropType {
  if (food && foodImages[food.id]) return foodImages[food.id];
  if (food?.category === 'Breakfast') return images.breakfast;
  if (food?.category === 'Snacks') return images.preferenceMixed;
  return images.lunch;
}

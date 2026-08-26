/// Corner-radius scale from DESIGN.md ("sophisticated large radii").
abstract final class NourishRadii {
  /// Buttons: 12px.
  static const double button = 12;

  /// Input fields: 12px.
  static const double input = 12;

  /// Standard card radius: 16px.
  static const double card = 16;

  /// Large card / hero radius: 24px (up to 32px on bento surfaces).
  static const double cardLg = 24;

  /// Food images / photo tiles: 24px.
  static const double image = 24;

  /// Small thumbnails in list rows: 8px.
  static const double thumbnail = 8;

  /// Full pill (chips, avatars). Finite value rendered as a stadium.
  static const double pill = 999;
}

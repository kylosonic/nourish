import 'package:flutter/material.dart';

import '../tokens/colors.dart';
import '../tokens/radii.dart';
import '../tokens/typography.dart';

/// Minimalist input field (DESIGN.md components): off-white background,
/// 1px outline that thickens on focus, uppercase label, unit suffix and a
/// visible error state with message.
class NourishInputField extends StatefulWidget {
  const NourishInputField({
    super.key,
    this.controller,
    required this.label,
    this.hint,
    this.suffix,
    this.keyboardType,
    this.onChanged,
    this.errorText,
    this.autofocus = false,
    this.textInputAction,
    this.onSubmitted,
  });

  final TextEditingController? controller;
  final String label;
  final String? hint;

  /// Unit shown at the end of the field, e.g. `cm` or `kg`.
  final String? suffix;
  final TextInputType? keyboardType;
  final ValueChanged<String>? onChanged;
  final String? errorText;
  final bool autofocus;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;

  @override
  State<NourishInputField> createState() => _NourishInputFieldState();
}

class _NourishInputFieldState extends State<NourishInputField> {
  final FocusNode _focusNode = FocusNode();
  bool _focused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      setState(() => _focused = _focusNode.hasFocus);
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool hasError = widget.errorText != null;

    final Color borderColor = hasError
        ? NourishColors.error
        : _focused
        ? NourishColors.onSurface
        : NourishColors.outline;
    final double borderWidth = _focused || hasError ? 2 : 1;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          widget.label.toUpperCase(),
          style: NourishTextStyles.labelCaps.copyWith(
            color: NourishColors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 8),
        AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          decoration: BoxDecoration(
            color: _focused
                ? NourishColors.surfaceContainerLowest
                : NourishColors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(NourishRadii.input),
            border: Border.all(color: borderColor, width: borderWidth),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: <Widget>[
              Expanded(
                child: TextField(
                  controller: widget.controller,
                  focusNode: _focusNode,
                  autofocus: widget.autofocus,
                  keyboardType: widget.keyboardType,
                  textInputAction: widget.textInputAction,
                  onChanged: widget.onChanged,
                  onSubmitted: widget.onSubmitted,
                  style: NourishTextStyles.bodyLg.copyWith(
                    color: NourishColors.onSurface,
                  ),
                  decoration: InputDecoration(
                    hintText: widget.hint,
                    hintStyle: NourishTextStyles.bodyLg.copyWith(
                      color: NourishColors.outlineVariant,
                    ),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
              if (widget.suffix != null)
                Text(
                  widget.suffix!,
                  style: NourishTextStyles.bodyLg.copyWith(
                    color: NourishColors.onSurfaceVariant,
                  ),
                ),
            ],
          ),
        ),
        if (widget.errorText != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              widget.errorText!,
              style: NourishTextStyles.bodyMd.copyWith(
                color: NourishColors.error,
                fontSize: 13,
                height: 1.3,
              ),
            ),
          ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:nourish_design_system/nourish_design_system.dart';

Widget _host(Widget child) {
  return MaterialApp(theme: buildNourishTheme(), home: Scaffold(body: child));
}

void main() {
  testWidgets('NourishButton renders primary/secondary/disabled states',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      _host(
        Column(
          children: const <Widget>[
            NourishButton(label: 'PRIMARY'),
            NourishButton(label: 'SECONDARY', variant: NourishButtonVariant.secondary),
            NourishButton(label: 'DISABLED', onPressed: null),
          ],
        ),
      ),
    );
    expect(find.text('PRIMARY'), findsOneWidget);
    expect(find.text('SECONDARY'), findsOneWidget);
    expect(find.text('DISABLED'), findsOneWidget);
    expect(find.byType(NourishButton), findsNWidgets(3));
  });

  testWidgets('NourishCard renders with child', (WidgetTester tester) async {
    await tester.pumpWidget(
      _host(const NourishCard(child: Text('card content'))),
    );
    expect(find.text('card content'), findsOneWidget);
  });

  testWidgets('MetricCard renders value, label and progress',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      _host(
        const MetricCard(value: '1,420', label: 'Calories Left', progress: 0.35),
      ),
    );
    expect(find.text('1,420'), findsOneWidget);
    expect(find.text('CALORIES LEFT'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('NourishProgressBar clamps value into 0..1',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      _host(const NourishProgressBar(value: 1.7)),
    );
    expect(find.byType(NourishProgressBar), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('NourishChip renders all variants', (WidgetTester tester) async {
    await tester.pumpWidget(
      _host(
        const Wrap(
          children: <Widget>[
            NourishChip(label: 'green'),
            NourishChip(label: 'amber', variant: NourishChipVariant.amber),
            NourishChip(label: 'red', variant: NourishChipVariant.red),
            NourishChip(label: 'neutral', variant: NourishChipVariant.neutral),
          ],
        ),
      ),
    );
    expect(find.text('green'), findsOneWidget);
    expect(find.text('amber'), findsOneWidget);
    expect(find.text('red'), findsOneWidget);
    expect(find.text('neutral'), findsOneWidget);
  });

  testWidgets('NourishInputField renders with error message',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      _host(
        const NourishInputField(
          label: 'Age',
          hint: 'e.g. 30',
          suffix: 'yrs',
          errorText: 'Enter an age between 18 and 100.',
        ),
      ),
    );
    expect(find.text('AGE'), findsOneWidget);
    expect(find.text('yrs'), findsOneWidget);
    expect(find.text('Enter an age between 18 and 100.'), findsOneWidget);
  });

  testWidgets('RadioSelector renders options and reports selection',
      (WidgetTester tester) async {
    String? selected;
    await tester.pumpWidget(
      _host(
        StatefulBuilder(
          builder: (BuildContext context, StateSetter setState) {
            return RadioSelector<String>(
              options: const <RadioSelectorOption<String>>[
                RadioSelectorOption<String>(value: 'en', title: 'English'),
                RadioSelectorOption<String>(
                  value: 'am',
                  title: 'አማርኛ',
                  subtitle: 'Amharic',
                ),
              ],
              value: selected ?? 'en',
              onChanged: (String value) => setState(() => selected = value),
            );
          },
        ),
      ),
    );
    expect(find.text('English'), findsOneWidget);
    expect(find.text('አማርኛ'), findsOneWidget);

    await tester.tap(find.text('አማርኛ'));
    await tester.pumpAndSettle();
    expect(selected, 'am');
  });

  testWidgets('SegmentedSelector renders segments and reports selection',
      (WidgetTester tester) async {
    String? selected;
    await tester.pumpWidget(
      _host(
        StatefulBuilder(
          builder: (BuildContext context, StateSetter setState) {
            return SegmentedSelector<String>(
              options: const <SegmentedSelectorOption<String>>[
                SegmentedSelectorOption<String>(value: 'f', label: 'Female'),
                SegmentedSelectorOption<String>(value: 'm', label: 'Male'),
              ],
              value: selected ?? 'f',
              onChanged: (String value) => setState(() => selected = value),
            );
          },
        ),
      ),
    );
    expect(find.text('Female'), findsOneWidget);
    expect(find.text('Male'), findsOneWidget);

    await tester.tap(find.text('Male'));
    await tester.pumpAndSettle();
    expect(selected, 'm');
  });
}

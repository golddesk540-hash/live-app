const fs = require('fs');

const file = 'apps/mobile/test/me_module_test.dart';
let c = fs.readFileSync(file, 'utf8');

// 1. Add RecognitionScreen import
if (!c.includes("import 'package:popo_live/screens/recognition/recognition_screen.dart';")) {
  c = c.replace(
    "import 'package:popo_live/screens/task_level/task_level_screen.dart';",
    "import 'package:popo_live/screens/task_level/task_level_screen.dart';\nimport 'package:popo_live/screens/recognition/recognition_screen.dart';"
  );
}

// 2. Update test 10 description & assertion
c = c.replace(
  "testWidgets('10. Honor Level feature icon opens TaskLevelScreen',",
  "testWidgets('10. Honor Level feature icon opens RecognitionScreen (Section 5, R3)',"
);
c = c.replace(
  "expect(find.byType(TaskLevelScreen), findsOneWidget);",
  "expect(find.byType(RecognitionScreen), findsOneWidget);"
);

// 3. Update test 21 Party tab tap
c = c.replace(
  "      // Switch to Explore tab (index 1)\n      await tester.tap(find.text('Explore').last);",
  "      // Switch to Party tab (index 1, Section 3 R1)\n      await tester.tap(find.text('Party'));"
);

fs.writeFileSync(file, c, 'utf8');
console.log('Successfully updated me_module_test.dart!');

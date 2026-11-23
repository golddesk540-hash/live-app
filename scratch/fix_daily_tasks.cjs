const fs = require('fs');
const file = 'apps/mobile/lib/screens/daily_tasks/daily_host_tasks_screen.dart';
let c = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

if (!c.includes("import '../../widgets/popo_error_state.dart';")) {
  c = c.replace("import 'package:flutter/material.dart';\n", "import 'package:flutter/material.dart';\nimport '../../widgets/popo_error_state.dart';\n");
}

const oldB = '  @override\n  Widget build(BuildContext context) {\n    final total = _tasks.length;';
const newB = `  @override
  Widget build(BuildContext context) {
    if (DesignFixtures.isError || _errorMessage != null) {
      return Scaffold(
        backgroundColor: const Color(0xFF0D031B),
        appBar: AppBar(
          backgroundColor: const Color(0xFF120624),
          foregroundColor: Colors.white,
          title: const Text('Daily Host Tasks', style: TextStyle(fontWeight: FontWeight.w800)),
        ),
        body: Center(
          child: PopoErrorState(
            title: 'Task progress sync failed',
            message: _errorMessage ?? 'Server busy [ERR_TASK_SYNC_503]',
            retryText: 'Retry',
            onRetry: _loadBackendTasks,
          ),
        ),
      );
    }
    final total = _tasks.length;`;

if (c.includes(oldB)) {
  c = c.replace(oldB, () => newB);
  fs.writeFileSync(file, c, 'utf8');
  console.log('Successfully updated daily_host_tasks_screen.dart');
} else {
  console.log('oldB not found in daily_host_tasks_screen.dart');
}

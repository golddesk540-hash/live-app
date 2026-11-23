const fs = require('fs');

// 1. Fix DailyHostTasksScreen RenderFlex overflows
{
  const file = 'apps/mobile/lib/screens/daily_tasks/daily_host_tasks_screen.dart';
  let c = fs.readFileSync(file, 'utf8');

  // Fix header row
  const oldHeaderRow = `                    children: [
                      Text(
                        "TODAY'S PROGRESS · $_dateLabel",
                        style: const TextStyle(
                          color: Color(0xFFC3B1DF),
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.1,
                        ),
                      ),`;

  const newHeaderRow = `                    children: [
                      Flexible(
                        child: Text(
                          "TODAY'S PROGRESS · $_dateLabel",
                          style: const TextStyle(
                            color: Color(0xFFC3B1DF),
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.1,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),`;

  if (c.includes(oldHeaderRow)) {
    c = c.replace(oldHeaderRow, newHeaderRow);
  }

  // Fix item category row
  const oldCatRow = `                            Row(
                              children: [
                                Text(
                                  task.category,
                                  style: const TextStyle(
                                    color: Color(0xFFFF85B3),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const Spacer(),`;

  const newCatRow = `                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    task.category,
                                    style: const TextStyle(
                                      color: Color(0xFFFF85B3),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const Spacer(),`;

  if (c.includes(oldCatRow)) {
    c = c.replace(oldCatRow, newCatRow);
  }

  fs.writeFileSync(file, c, 'utf8');
  console.log('1. Fixed DailyHostTasksScreen overflows');
}

// 2. Fix unescaped dollar signs in test
{
  const file = 'apps/mobile/test/r4_centers_and_children_test.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replaceAll("'25,000 ($25)'", "r'25,000 ($25)'");
  c = c.replaceAll("'Withdraw $25.00 USD'", "r'Withdraw $25.00 USD'");
  fs.writeFileSync(file, c, 'utf8');
  console.log('2. Fixed unescaped $ in test file');
}

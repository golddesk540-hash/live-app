const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../apps/mobile/lib/screens/profile/me_screen.dart');
let content = fs.readFileSync(file, 'utf8');

const target = "                  Row(\r\n" +
"                    children: [\r\n" +
"                      Text(\r\n" +
"                        'VIP ${user.vipLevel} • ${user.vipStatus}',\r\n" +
"                        key: const Key('me_vip_status_text'),\r\n" +
"                        style: const TextStyle(\r\n" +
"                          color: Color(0xFFFFD700),\r\n" +
"                          fontSize: 14,\r\n" +
"                          fontWeight: FontWeight.w800,\r\n" +
"                        ),\r\n" +
"                      ),\r\n" +
"                    ],\r\n" +
"                  ),";

const replacement = "                  Row(\r\n" +
"                    children: [\r\n" +
"                      Expanded(\r\n" +
"                        child: Text(\r\n" +
"                          'VIP ${user.vipLevel} • ${user.vipStatus}',\r\n" +
"                          key: const Key('me_vip_status_text'),\r\n" +
"                          style: const TextStyle(\r\n" +
"                            color: Color(0xFFFFD700),\r\n" +
"                            fontSize: 14,\r\n" +
"                            fontWeight: FontWeight.w800,\r\n" +
"                          ),\r\n" +
"                          overflow: TextOverflow.ellipsis,\r\n" +
"                        ),\r\n" +
"                      ),\r\n" +
"                    ],\r\n" +
"                  ),";

if (content.includes(target)) {
  fs.writeFileSync(file, content.replace(target, replacement), 'utf8');
  console.log('Successfully updated me_screen.dart');
} else {
  console.log('Target not matched exactly, checking LF version...');
  const targetLf = target.replace(/\r\n/g, '\n');
  const replacementLf = replacement.replace(/\r\n/g, '\n');
  if (content.includes(targetLf)) {
    fs.writeFileSync(file, content.replace(targetLf, replacementLf), 'utf8');
    console.log('Successfully updated me_screen.dart (LF)');
  } else {
    console.error('Failed to locate target in me_screen.dart');
  }
}

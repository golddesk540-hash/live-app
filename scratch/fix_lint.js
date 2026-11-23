const fs = require('fs');
let lines = fs.readFileSync('apps/mobile/lib/screens/party/party_room_screen.dart', 'utf8').split('\n');
const replacement = [
'                                       onPressed: () async {',
'                                         final messenger = ScaffoldMessenger.of(sheetContext);',
'                                         final nav = Navigator.of(sheetContext);',
'                                         final acceptRes =',
'                                             await PartyApiService()',
'                                                 .acceptPartyRequest(',
'                                           roomId: _room.id,',
'                                           requestId: reqId,',
'                                         );',
'                                         if (acceptRes.isSuccess) {',
'                                           if (sheetContext.mounted) {',
'                                             nav.pop();',
'                                             messenger.showSnackBar(',
'                                               SnackBar(',
'                                                 content: Text(',
'                                                     \'$userName accepted for Seat #$seatNum! 🎙️\'),',
'                                                 backgroundColor:',
'                                                     const Color(0xFF00C853),',
'                                               ),',
'                                             );',
'                                           }',
'                                         }',
'                                       },'
];
lines.splice(628, 651 - 628 + 1, ...replacement);
fs.writeFileSync('apps/mobile/lib/screens/party/party_room_screen.dart', lines.join('\n'), 'utf8');
console.log('Replaced successfully!');

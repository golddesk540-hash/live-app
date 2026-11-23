const fs = require('fs');

// 1. CoinSellerScreen: Add Seller Profile Card
{
  const filePath = 'apps/mobile/lib/screens/agency_management/coin_seller_screen.dart';
  let src = fs.readFileSync(filePath, 'utf8');
  const target = '// Inventory & Stats Card';
  const replacement = `// Seller Profile Card (R4)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: PopoTheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: PopoTheme.borderSubtle),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: PopoTheme.gold.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.verified, color: PopoTheme.gold, size: 26),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          DesignFixtures.coinSellerInfo.sellerName,
                          style: const TextStyle(
                            color: PopoTheme.textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Agent: \${DesignFixtures.coinSellerInfo.agentName} • WhatsApp: \${DesignFixtures.coinSellerInfo.whatsappContact}',
                          style: const TextStyle(
                            color: PopoTheme.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Inventory & Stats Card`;

  if (!src.includes('Seller Profile Card (R4)')) {
    src = src.replace(target, replacement);
    fs.writeFileSync(filePath, src, 'utf8');
    console.log('Fixed coin_seller_screen.dart');
  }
}

// 2. WithdrawalScreen: Replace Available For Withdrawal with WITHDRAWAL POINTS BALANCE
{
  const filePath = 'apps/mobile/lib/screens/agency_management/withdrawal_screen.dart';
  let src = fs.readFileSync(filePath, 'utf8');
  if (src.includes("'Available For Withdrawal'")) {
    src = src.replace("'Available For Withdrawal'", "'WITHDRAWAL POINTS BALANCE'");
    fs.writeFileSync(filePath, src, 'utf8');
    console.log('Fixed withdrawal_screen.dart');
  }
}

// 3. EditProfileScreen: set _isLoading = false and check canPop()
{
  const filePath = 'apps/mobile/lib/screens/profile/edit_profile_screen.dart';
  let src = fs.readFileSync(filePath, 'utf8');
  if (!src.includes('Navigator.of(context).canPop()')) {
    src = src.replace(
      'Navigator.of(context).pop(true);',
      `setState(() { _isLoading = false; });
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop(true);
    }`
    );
    fs.writeFileSync(filePath, src, 'utf8');
    console.log('Fixed edit_profile_screen.dart');
  }
}

// 4. r4_centers_and_children_test.dart: update poppoId check from 883901 to 8839201
{
  const filePath = 'apps/mobile/test/r4_centers_and_children_test.dart';
  let src = fs.readFileSync(filePath, 'utf8');
  if (src.includes("expect(find.textContaining('883901'), findsOneWidget);")) {
    src = src.replace(
      "expect(find.textContaining('883901'), findsOneWidget);",
      "expect(find.textContaining(DesignFixtures.currentUserProfile.poppoId), findsOneWidget);"
    );
    fs.writeFileSync(filePath, src, 'utf8');
    console.log('Fixed r4_centers_and_children_test.dart');
  }
}

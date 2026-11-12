import 'package:flutter/material.dart';

/// Popo Live — Module 9.10 Withdrawals (Frontend Preview Scaffold)
/// Strictly demo values only — no real money transfers, bank connections,
/// payment gateways, official limits, or fee calculations.
class WithdrawalsScreen extends StatefulWidget {
  const WithdrawalsScreen({super.key});

  @override
  State<WithdrawalsScreen> createState() => _WithdrawalsScreenState();
}

class _WithdrawalsScreenState extends State<WithdrawalsScreen> {
  final int _availableDemoBalance = 8450;

  final List<Map<String, dynamic>> _sampleRequests = [
    {
      'id': 'WD1024',
      'amount': 1200,
      'method': 'Demo Bank Transfer (Placeholder)',
      'status': 'Pending',
      'date': 'Today · Nov 12, 2026',
    },
    {
      'id': 'WD1018',
      'amount': 1500,
      'method': 'Demo Bank Transfer (Placeholder)',
      'status': 'Approved',
      'date': 'Nov 05, 2026',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF110623),
      appBar: AppBar(
        backgroundColor: const Color(0xFF17092E),
        title: const Text('Popo Live · Withdrawals'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF231144),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.purpleAccent.withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'AVAILABLE BALANCE',
                  style: TextStyle(color: Colors.white60, fontSize: 11, letterSpacing: 1.2),
                ),
                const SizedBox(height: 8),
                Text(
                  '$_availableDemoBalance pts',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 30,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Demo balance · Not real funds',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          const Text(
            'Recent requests',
            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          ..._sampleRequests.map(
            (req) => Card(
              color: const Color(0xFF1B0E36),
              child: ListTile(
                title: Text(
                  'Request #${req['id']} · ${req['amount']} pts',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  '${req['method']} · ${req['date']}',
                  style: const TextStyle(color: Colors.white70),
                ),
                trailing: Text(
                  '${req['status']}',
                  style: TextStyle(
                    color: req['status'] == 'Approved'
                        ? const Color(0xFF34D399)
                        : const Color(0xFFFBBF24),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

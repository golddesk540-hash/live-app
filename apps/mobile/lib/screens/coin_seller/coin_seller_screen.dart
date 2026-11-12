import 'package:flutter/material.dart';

/// Popo Live — Module 9.9 Coin Seller (Frontend Preview Scaffold)
/// Strictly demo values only — no real coin transactions, payment gateways,
/// commission percentages, or wallet mutations.
class CoinSellerScreen extends StatefulWidget {
  const CoinSellerScreen({super.key});

  @override
  State<CoinSellerScreen> createState() => _CoinSellerScreenState();
}

class _CoinSellerScreenState extends State<CoinSellerScreen> {
  String _sellerStatus = 'Active';

  final List<Map<String, dynamic>> _sampleOrders = [
    {
      'orderId': 'ORD-9028',
      'buyer': '@mina_starlight',
      'coins': 2000,
      'status': 'Processing',
      'date': 'Today · Nov 12, 2026',
    },
    {
      'orderId': 'ORD-9027',
      'buyer': '@kairo_beats',
      'coins': 1500,
      'status': 'Pending',
      'date': 'Today · Nov 12, 2026',
    },
    {
      'orderId': 'ORD-9025',
      'buyer': '@leo_streamz',
      'coins': 2000,
      'status': 'Completed',
      'date': 'Today · Nov 12, 2026',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF110623),
      appBar: AppBar(
        backgroundColor: const Color(0xFF17092E),
        title: const Text('Popo Live · Coin Seller'),
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
                  'SELLER STATUS',
                  style: TextStyle(color: Colors.white60, fontSize: 11, letterSpacing: 1.2),
                ),
                const SizedBox(height: 8),
                Text(
                  '$_sellerStatus Seller',
                  style: const TextStyle(
                    color: Color(0xFF34D399),
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Seller ID: CS-10582 · Demo values only',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Seller dashboard',
            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          _metricCard('Coin sales today', '12,500'),
          _metricCard('Orders today', '18'),
          _metricCard('Pending orders', '3'),
          _metricCard('Available balance', '8,200'),
          const SizedBox(height: 14),
          ..._sampleOrders.map(
            (ord) => Card(
              color: const Color(0xFF1B0E36),
              child: ListTile(
                title: Text(
                  '${ord['orderId']} · ${ord['buyer']}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  '${ord['date']} · ${ord['status']}',
                  style: const TextStyle(color: Colors.white70),
                ),
                trailing: Text(
                  '${ord['coins']} Coins',
                  style: const TextStyle(color: Color(0xFFFBBF24), fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _metricCard(String title, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF1B0E36),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.purpleAccent.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          Text(value, style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

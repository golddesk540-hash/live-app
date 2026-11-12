import 'package:flutter/material.dart';

/// Popo Live — Module 9.1 Identity for Earning (Flutter parity UI)
/// Frontend display & local state only — zero real KYC or server document uploads.
class EarningIdentityScreen extends StatefulWidget {
  const EarningIdentityScreen({super.key});

  @override
  State<EarningIdentityScreen> createState() => _EarningIdentityScreenState();
}

class _EarningIdentityScreenState extends State<EarningIdentityScreen> {
  String _status = 'Incomplete';
  String _legalName = 'Ayesha Khan';
  String _country = 'Pakistan';
  String _dobMasked = '•• / •• / ••••';
  String _docStatus = 'Not submitted';

  static const _statuses = <String>[
    'Not Started',
    'Incomplete',
    'Submitted',
    'Under Review',
    'Verified',
    'Rejected',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D031B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        title: const Text(
          'Earning Identity',
          style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF1B0C35),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0x55A855F7)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFFF1A6C), width: 3),
                        color: const Color(0xFF28124D),
                      ),
                      child: const Icon(Icons.person, color: Colors.white),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _legalName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 18,
                            ),
                          ),
                          const Text(
                            'Host ID: 20845176',
                            style: TextStyle(color: Color(0xFFD8B4FE), fontSize: 12),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0x28FFB800),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              _status.toUpperCase(),
                              style: const TextStyle(
                                color: Color(0xFFFFD166),
                                fontWeight: FontWeight.w800,
                                fontSize: 10,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Earning profile status',
                      style: TextStyle(color: Color(0xFFD8B4FE), fontSize: 12),
                    ),
                    Text(
                      _status,
                      style: const TextStyle(
                        color: Color(0xFFFFD166),
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          const Text(
            'Identity information',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16),
          ),
          const SizedBox(height: 10),
          _infoCard('Legal name', _legalName),
          _infoCard('Country', _country),
          _infoCard('Date of birth', _dobMasked),
          _infoCard('Identity document', _docStatus),
          const SizedBox(height: 16),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF1A6C),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 15),
              shape: const StadiumBorder(),
            ),
            onPressed: () {
              setState(() {
                _dobMasked = '•• / •• / 1998';
                _docStatus = 'National ID Card · Local preview ready';
                _status = 'Submitted';
              });
            },
            child: const Text(
              'Continue Verification',
              style: TextStyle(fontWeight: FontWeight.w900),
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _statuses.map((st) {
              return ChoiceChip(
                label: Text(st),
                selected: _status == st,
                onSelected: (_) => setState(() => _status = st),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _infoCard(String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF180A33),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0x33A855F7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(color: Color(0xFFD8B4FE), fontSize: 12)),
        ],
      ),
    );
  }
}

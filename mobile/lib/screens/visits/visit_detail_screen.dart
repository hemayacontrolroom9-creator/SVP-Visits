import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../providers/visits_provider.dart';
import '../../models/visit_model.dart';

class VisitDetailScreen extends ConsumerWidget {
  final String visitId;
  const VisitDetailScreen({super.key, required this.visitId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visitAsync = ref.watch(visitDetailProvider(visitId));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Visit Details')),
      body: visitAsync.when(
        data: (visit) {
          if (visit == null) return const Center(child: Text('Visit not found'));
          final statusColor = visit.isCompleted ? Colors.green : visit.isInProgress ? Colors.orange : Colors.blue;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Status header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.circle, size: 12, color: statusColor),
                      const SizedBox(width: 8),
                      Text(visit.status.name.toUpperCase().replaceAll('_', ' '),
                          style: TextStyle(fontWeight: FontWeight.bold, color: statusColor)),
                      const Spacer(),
                      if (visit.visitNumber != null)
                        Text('#${visit.visitNumber}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                _InfoCard(title: 'Site', children: [
                  _InfoRow('Name', visit.site?['name'] ?? '-'),
                  _InfoRow('Code', visit.site?['siteCode'] ?? '-'),
                  _InfoRow('Address', visit.site?['address'] ?? '-'),
                ]),

                const SizedBox(height: 12),
                _InfoCard(title: 'Schedule', children: [
                  _InfoRow('Scheduled', DateFormat('MMM dd, yyyy h:mm a').format(visit.scheduledAt)),
                  if (visit.startedAt != null)
                    _InfoRow('Started', DateFormat('MMM dd, yyyy h:mm a').format(visit.startedAt!)),
                  if (visit.completedAt != null)
                    _InfoRow('Completed', DateFormat('MMM dd, yyyy h:mm a').format(visit.completedAt!)),
                  if (visit.durationMinutes != null)
                    _InfoRow('Duration', '${visit.durationMinutes} minutes'),
                ]),

                const SizedBox(height: 12),
                _InfoCard(title: 'Verification', children: [
                  _InfoRow('GPS', visit.isGpsVerified ? '✅ Verified' : '❌ Not verified'),
                  _InfoRow('QR Code', visit.isQrVerified ? '✅ Verified' : '❌ Not verified'),
                  if (visit.checkInDistanceMeters != null)
                    _InfoRow('Distance from site', '${visit.checkInDistanceMeters}m'),
                ]),

                const SizedBox(height: 24),

                // Action buttons
                if (visit.isScheduled)
                  ElevatedButton.icon(
                    icon: const Icon(Icons.login),
                    label: const Text('Check In'),
                    onPressed: () => context.push('/visits/$visitId/check-in'),
                  ),
                if (visit.isInProgress)
                  ElevatedButton.icon(
                    icon: const Icon(Icons.logout),
                    label: const Text('Check Out'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                    onPressed: () => _showCheckOutDialog(context, ref, visit),
                  ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  void _showCheckOutDialog(BuildContext context, WidgetRef ref, VisitModel visit) {
    final notesCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Check Out'),
        content: TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Notes (optional)'), maxLines: 3),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              // TODO: call checkOut API
            },
            child: const Text('Confirm Check Out'),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _InfoCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const Divider(),
          ...children,
        ],
      ),
    ),
  );
}

class _InfoRow extends StatelessWidget {
  final String label, value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(width: 120, child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13))),
        Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
      ],
    ),
  );
}

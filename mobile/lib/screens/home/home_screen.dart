import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../providers/visits_provider.dart';
import '../../models/visit_model.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final todayVisits = ref.watch(todayVisitsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () {}),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(todayVisitsProvider),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome card
              Card(
                color: theme.colorScheme.primary,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: Colors.white24,
                        child: Text(
                          '${user?['firstName']?[0] ?? ''}${user?['lastName']?[0] ?? ''}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Welcome back,', style: TextStyle(color: Colors.white70, fontSize: 13)),
                          Text(
                            '${user?['firstName'] ?? ''} ${user?['lastName'] ?? ''}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Today's stats
              todayVisits.when(
                data: (visits) => _buildStats(context, visits),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const SizedBox(),
              ),

              const SizedBox(height: 16),

              // Today's visits
              Text("Today's Visits", style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              todayVisits.when(
                data: (visits) => visits.isEmpty
                    ? Card(child: ListTile(leading: Icon(Icons.check_circle_outline, color: theme.colorScheme.secondary), title: Text('No visits scheduled today')))
                    : Column(children: visits.map((v) => _VisitCard(visit: v)).toList()),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Card(child: ListTile(title: Text('Failed to load: $e'))),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStats(BuildContext context, List<VisitModel> visits) {
    final completed = visits.where((v) => v.isCompleted).length;
    final inProgress = visits.where((v) => v.isInProgress).length;
    final scheduled = visits.where((v) => v.isScheduled).length;

    return Row(
      children: [
        _StatChip(value: '${visits.length}', label: 'Total', color: Colors.blue),
        const SizedBox(width: 8),
        _StatChip(value: '$completed', label: 'Done', color: Colors.green),
        const SizedBox(width: 8),
        _StatChip(value: '$inProgress', label: 'Active', color: Colors.orange),
        const SizedBox(width: 8),
        _StatChip(value: '$scheduled', label: 'Pending', color: Colors.grey),
      ],
    );
  }
}

class _StatChip extends StatelessWidget {
  final String value, label;
  final Color color;
  const _StatChip({required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            children: [
              Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
              Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }
}

class _VisitCard extends StatelessWidget {
  final VisitModel visit;
  const _VisitCard({required this.visit});

  Color get _statusColor {
    switch (visit.status) {
      case VisitStatus.completed: return Colors.green;
      case VisitStatus.in_progress: return Colors.orange;
      case VisitStatus.missed: return Colors.red;
      default: return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(backgroundColor: _statusColor.withOpacity(0.15), child: Icon(Icons.location_on, color: _statusColor, size: 20)),
        title: Text(visit.site?['name'] ?? 'Unknown Site', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: Text(DateFormat('h:mm a').format(visit.scheduledAt)),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(color: _statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
          child: Text(visit.status.name.replaceAll('_', ' '), style: TextStyle(color: _statusColor, fontSize: 11, fontWeight: FontWeight.w600)),
        ),
        onTap: () => context.push('/visits/${visit.id}'),
      ),
    );
  }
}

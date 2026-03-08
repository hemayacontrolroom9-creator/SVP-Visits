import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/api_service.dart';

final sitesProvider = FutureProvider<List<dynamic>>((ref) async {
  final api = ref.read(apiServiceProvider);
  return api.getSites();
});

class SitesScreen extends ConsumerWidget {
  const SitesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sitesAsync = ref.watch(sitesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Sites')),
      body: sitesAsync.when(
        data: (sites) => ListView.separated(
          padding: const EdgeInsets.all(12),
          itemCount: sites.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, i) {
            final site = sites[i] as Map<String, dynamic>;
            return Card(
              child: ListTile(
                leading: CircleAvatar(backgroundColor: Colors.blue.shade50, child: Icon(Icons.location_on, color: Colors.blue)),
                title: Text(site['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('${site['siteCode']} • ${site['city'] ?? site['address']}'),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: site['status'] == 'active' ? Colors.green.shade50 : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(site['status'] ?? '', style: TextStyle(color: site['status'] == 'active' ? Colors.green : Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ),
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}

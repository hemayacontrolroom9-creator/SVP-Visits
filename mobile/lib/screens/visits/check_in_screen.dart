import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:geolocator/geolocator.dart';
import '../../services/api_service.dart';
import '../../services/gps_service.dart';
import '../../services/sync_service.dart';
import '../../providers/visits_provider.dart';

class CheckInScreen extends ConsumerStatefulWidget {
  final String visitId;
  const CheckInScreen({super.key, required this.visitId});

  @override
  ConsumerState<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends ConsumerState<CheckInScreen> {
  Position? _currentPosition;
  bool _isGettingLocation = false;
  bool _isCheckingIn = false;
  String? _qrCode;
  bool _showQrScanner = false;
  String? _error;
  double? _distanceFromSite;

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isGettingLocation = true);
    try {
      final gps = ref.read(gpsServiceProvider);
      _currentPosition = await gps.getCurrentPosition();
    } catch (e) {
      setState(() => _error = 'Could not get location: $e');
    } finally {
      setState(() => _isGettingLocation = false);
    }
  }

  Future<void> _checkIn({bool forceCheckIn = false}) async {
    setState(() { _isCheckingIn = true; _error = null; });
    try {
      final api = ref.read(apiServiceProvider);
      await api.checkIn(
        widget.visitId,
        latitude: _currentPosition?.latitude,
        longitude: _currentPosition?.longitude,
        accuracy: _currentPosition?.accuracy,
        qrCode: _qrCode,
        forceCheckIn: forceCheckIn,
      );
      ref.invalidate(visitDetailProvider(widget.visitId));
      ref.invalidate(visitsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✅ Checked in successfully!'), backgroundColor: Colors.green));
        Navigator.pop(context, true);
      }
    } catch (e) {
      final msg = e.toString();
      if (msg.contains('outside geofence') || msg.contains('forceCheckIn')) {
        _showForceCheckInDialog();
      } else if (msg.contains('Failed host lookup') || msg.contains('SocketException')) {
        // Offline - queue action
        final syncService = ref.read(syncServiceProvider);
        await syncService.queueAction('check_in', {
          'visitId': widget.visitId,
          'latitude': _currentPosition?.latitude,
          'longitude': _currentPosition?.longitude,
          'qrCode': _qrCode,
          'timestamp': DateTime.now().toIso8601String(),
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('📴 Offline - Check-in queued for sync'),
            backgroundColor: Colors.orange,
          ));
          Navigator.pop(context, true);
        }
      } else {
        setState(() => _error = msg.replaceAll('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _isCheckingIn = false);
    }
  }

  void _showForceCheckInDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Outside Geofence'),
        content: const Text('You are outside the site geofence. Do you want to force check-in anyway?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () { Navigator.pop(ctx); _checkIn(forceCheckIn: true); },
            child: const Text('Force Check-in'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Check In')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // GPS Status
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.gps_fixed, color: _currentPosition != null ? Colors.green : Colors.orange),
                        const SizedBox(width: 8),
                        const Text('GPS Location', style: TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_isGettingLocation)
                      const Row(children: [SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)), SizedBox(width: 8), Text('Getting location...')])
                    else if (_currentPosition != null)
                      Text('Lat: ${_currentPosition!.latitude.toStringAsFixed(6)}\nLng: ${_currentPosition!.longitude.toStringAsFixed(6)}\nAccuracy: ±${_currentPosition!.accuracy.toStringAsFixed(0)}m',
                          style: const TextStyle(fontSize: 13, color: Colors.grey))
                    else
                      const Text('Location unavailable', style: TextStyle(color: Colors.red)),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: _getCurrentLocation,
                      icon: const Icon(Icons.refresh, size: 16),
                      label: const Text('Refresh Location'),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // QR Code Scanner
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.qr_code_scanner, color: _qrCode != null ? Colors.green : Colors.grey),
                        const SizedBox(width: 8),
                        const Text('QR Code (Optional)', style: TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_qrCode != null)
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(8)),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle, color: Colors.green, size: 16),
                            const SizedBox(width: 8),
                            const Text('QR code scanned', style: TextStyle(color: Colors.green)),
                          ],
                        ),
                      )
                    else
                      OutlinedButton.icon(
                        onPressed: () => setState(() => _showQrScanner = !_showQrScanner),
                        icon: const Icon(Icons.qr_code_scanner),
                        label: const Text('Scan QR Code'),
                      ),
                    if (_showQrScanner)
                      Container(
                        height: 200,
                        margin: const EdgeInsets.only(top: 12),
                        decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), overflow: Clip.antiAlias),
                        child: MobileScanner(
                          onDetect: (capture) {
                            final barcode = capture.barcodes.firstOrNull;
                            if (barcode?.rawValue != null) {
                              setState(() { _qrCode = barcode!.rawValue; _showQrScanner = false; });
                            }
                          },
                        ),
                      ),
                  ],
                ),
              ),
            ),

            if (_error != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: theme.colorScheme.errorContainer, borderRadius: BorderRadius.circular(12)),
                child: Text(_error!, style: TextStyle(color: theme.colorScheme.onErrorContainer)),
              ),
            ],

            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _isCheckingIn || _isGettingLocation ? null : _checkIn,
              icon: _isCheckingIn
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.login),
              label: Text(_isCheckingIn ? 'Checking In...' : 'Check In Now'),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:json_annotation/json_annotation.dart';

part 'visit_model.g.dart';

enum VisitStatus { scheduled, in_progress, completed, missed, cancelled }

@JsonSerializable()
class VisitModel {
  final String id;
  @JsonKey(name: 'supervisor_id') final String supervisorId;
  @JsonKey(name: 'site_id') final String siteId;
  final VisitStatus status;
  @JsonKey(name: 'scheduled_at') final DateTime scheduledAt;
  @JsonKey(name: 'started_at') final DateTime? startedAt;
  @JsonKey(name: 'completed_at') final DateTime? completedAt;
  @JsonKey(name: 'is_gps_verified') final bool isGpsVerified;
  @JsonKey(name: 'is_qr_verified') final bool isQrVerified;
  @JsonKey(name: 'duration_minutes') final int? durationMinutes;
  @JsonKey(name: 'check_in_latitude') final double? checkInLatitude;
  @JsonKey(name: 'check_in_longitude') final double? checkInLongitude;
  @JsonKey(name: 'check_in_distance_meters') final int? checkInDistanceMeters;
  @JsonKey(name: 'photo_urls') final List<String>? photoUrls;
  @JsonKey(name: 'visit_number') final int? visitNumber;
  final String? notes;
  final Map<String, dynamic>? supervisor;
  final Map<String, dynamic>? site;

  const VisitModel({
    required this.id, required this.supervisorId, required this.siteId,
    required this.status, required this.scheduledAt, this.startedAt,
    this.completedAt, required this.isGpsVerified, required this.isQrVerified,
    this.durationMinutes, this.checkInLatitude, this.checkInLongitude,
    this.checkInDistanceMeters, this.photoUrls, this.visitNumber,
    this.notes, this.supervisor, this.site,
  });

  bool get isScheduled => status == VisitStatus.scheduled;
  bool get isInProgress => status == VisitStatus.in_progress;
  bool get isCompleted => status == VisitStatus.completed;

  factory VisitModel.fromJson(Map<String, dynamic> json) => _$VisitModelFromJson(json);
  Map<String, dynamic> toJson() => _$VisitModelToJson(this);
}

import 'package:json_annotation/json_annotation.dart';

part 'site_model.g.dart';

@JsonSerializable()
class SiteModel {
  final String id;
  final String name;
  @JsonKey(name: 'site_code') final String siteCode;
  final String address;
  final String? city;
  final String? country;
  final double latitude;
  final double longitude;
  @JsonKey(name: 'geofence_radius') final int geofenceRadius;
  final String status;
  @JsonKey(name: 'contact_name') final String? contactName;
  @JsonKey(name: 'contact_phone') final String? contactPhone;
  @JsonKey(name: 'qr_code') final String? qrCode;
  @JsonKey(name: 'visit_frequency_days') final int visitFrequencyDays;

  const SiteModel({
    required this.id, required this.name, required this.siteCode,
    required this.address, this.city, this.country, required this.latitude,
    required this.longitude, required this.geofenceRadius, required this.status,
    this.contactName, this.contactPhone, this.qrCode, required this.visitFrequencyDays,
  });

  factory SiteModel.fromJson(Map<String, dynamic> json) => _$SiteModelFromJson(json);
  Map<String, dynamic> toJson() => _$SiteModelToJson(this);
}

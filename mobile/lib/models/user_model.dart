import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

@JsonSerializable()
class UserModel {
  final String id;
  final String email;
  @JsonKey(name: 'first_name') final String firstName;
  @JsonKey(name: 'last_name') final String lastName;
  final String role;
  final String? phone;
  @JsonKey(name: 'avatar_url') final String? avatarUrl;
  @JsonKey(name: 'is_active') final bool isActive;
  @JsonKey(name: 'fcm_token') final String? fcmToken;

  const UserModel({
    required this.id, required this.email, required this.firstName,
    required this.lastName, required this.role, this.phone,
    this.avatarUrl, required this.isActive, this.fcmToken,
  });

  String get fullName => '$firstName $lastName';
  bool get isAdmin => role == 'admin';
  bool get isManager => role == 'manager';
  bool get isSupervisor => role == 'supervisor';

  factory UserModel.fromJson(Map<String, dynamic> json) => _$UserModelFromJson(json);
  Map<String, dynamic> toJson() => _$UserModelToJson(this);
}

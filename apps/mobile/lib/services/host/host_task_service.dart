import 'dart:async';
import 'package:flutter/material.dart';
import '../../api/api_client.dart';

/// Centralized service for Popo Live Host Tasks, Levels, Starter Pack & KYC Identity
class HostTaskService {
  HostTaskService._();
  static final HostTaskService instance = HostTaskService._();

  /// Checks if current user has host permissions
  Future<Map<String, dynamic>> checkEligibility() async {
    final response = await ApiClient.instance.get('/api/host/eligibility');
    if (!response.isSuccess || response.data == null) {
      return {'eligible': false, 'reason': response.error ?? 'FAILED_TO_CHECK'};
    }
    return response.data as Map<String, dynamic>;
  }

  /// Fetches daily host tasks from backend
  Future<Map<String, dynamic>> fetchDailyTasks() async {
    final response = await ApiClient.instance.get('/api/host/tasks');
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to load daily tasks.');
    }
    return response.data as Map<String, dynamic>;
  }

  /// Updates task progress
  Future<Map<String, dynamic>> updateTaskProgress(
    String taskId, {
    int? increment,
    int? absoluteProgress,
  }) async {
    final body = {
      if (increment != null) 'increment': increment,
      if (absoluteProgress != null) 'absoluteProgress': absoluteProgress,
    };

    final response = await ApiClient.instance.post('/api/host/tasks/$taskId/progress', body: body);
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to update task progress.');
    }
    return response.data as Map<String, dynamic>;
  }

  /// Claims reward for a completed task
  Future<Map<String, dynamic>> claimTaskReward(String taskId) async {
    final response = await ApiClient.instance.post('/api/host/tasks/$taskId/claim');
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to claim task reward.');
    }
    return response.data as Map<String, dynamic>;
  }

  /// Fetches host task level status
  Future<Map<String, dynamic>> fetchTaskLevel() async {
    final response = await ApiClient.instance.get('/api/host/tasks/level');
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to load task level.');
    }
    return response.data as Map<String, dynamic>;
  }

  /// Fetches new host starter pack configuration and claim status
  Future<Map<String, dynamic>> fetchStarterPack() async {
    final response = await ApiClient.instance.get('/api/host/starter-pack');
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to load starter pack.');
    }
    return response.data as Map<String, dynamic>;
  }

  /// Claims new host starter pack
  Future<Map<String, dynamic>> claimStarterPack() async {
    final response = await ApiClient.instance.post('/api/host/starter-pack/claim');
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to claim starter pack.');
    }
    return response.data as Map<String, dynamic>;
  }

  /// Fetches host earning identity
  Future<Map<String, dynamic>> fetchEarningIdentity() async {
    final response = await ApiClient.instance.get('/api/host/identity');
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to load host identity.');
    }
    return response.data as Map<String, dynamic>;
  }

  /// Submits host earning identity
  Future<Map<String, dynamic>> submitEarningIdentity({
    required String legalName,
    String country = 'Pakistan',
    String documentType = 'national_id',
    required String documentNumber,
  }) async {
    final body = {
      'legalName': legalName,
      'country': country,
      'documentType': documentType,
      'documentNumber': documentNumber,
    };

    final response = await ApiClient.instance.post('/api/host/identity', body: body);
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to submit host identity.');
    }
    return response.data as Map<String, dynamic>;
  }
}

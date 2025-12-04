import 'package:flutter/material.dart';
import '../models/listing.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';
import 'auth_provider.dart';

class ListingsProvider extends ChangeNotifier {
  List<Listing> _listings = [];
  bool _isLoading = false;
  String? _error;
  String? _userId;
  UserRole? _userRole;

  List<Listing> get listings => _listings;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    final newUserId = auth.userId;
    final newRole = auth.role;

    print(
      '[ListingsProvider] updateAuth called - newUserId: $newUserId, currentUserId: $_userId',
    );

    if (newUserId != _userId || newRole != _userRole) {
      _userId = newUserId;
      _userRole = newRole;
      if (_userId != null) {
        print('[ListingsProvider] userId changed, calling fetchListings()');
        fetchListings();
      }
    } else if (_userId != null && _listings.isEmpty && !_isLoading) {
      // If we have a userId but no listings, fetch them
      print(
        '[ListingsProvider] userId unchanged but listings empty, calling fetchListings()',
      );
      fetchListings();
    }
  }

  Future<void> fetchListings() async {
    if (_userId == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('[ListingsProvider] Fetching listings...');
      final data = await apiClient.get(ApiConfig.listingsUrl);
      print('[ListingsProvider] Raw response: $data');
      // Backend returns { "listings": [...], "total": X }
      final listingsList = data['listings'] as List? ?? [];
      _listings = listingsList.map((json) => Listing.fromJson(json)).toList();
      print('[ListingsProvider] Loaded ${_listings.length} listings');
      for (final l in _listings) {
        print(
          '[ListingsProvider] Loaded listing: id=${l.id}, brokerId=${l.brokerId}',
        );
      }
      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  List<Listing> getListingsByBrokerId(String brokerId) {
    final trimmedBrokerId = brokerId.trim();
    print(
      '[ListingsProvider] getListingsByBrokerId called with: "$trimmedBrokerId" (length: ${trimmedBrokerId.length})',
    );
    print('[ListingsProvider] Total listings: ${_listings.length}');
    for (final l in _listings) {
      final listingBrokerId = l.brokerId?.trim() ?? '';
      print(
        '[ListingsProvider] Listing ${l.id}: brokerId="$listingBrokerId" (length: ${listingBrokerId.length}), matches=${listingBrokerId == trimmedBrokerId}',
      );
    }
    final filtered = _listings
        .where((listing) => listing.brokerId?.trim() == trimmedBrokerId)
        .toList();
    print('[ListingsProvider] Filtered listings: ${filtered.length}');
    return filtered;
  }

  List<Listing> get activeListings {
    return _listings.where((l) => l.status == ListingStatus.ativo).toList();
  }

  Future<bool> createListing(Listing listing) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print(
        '[ListingsProvider] Creating listing with brokerId: ${listing.brokerId}',
      );
      print('[ListingsProvider] Request data: ${listing.toJson()}');
      final data = await apiClient.post(
        ApiConfig.listingsUrl,
        data: listing.toJson(),
      );
      print('[ListingsProvider] Response data: $data');
      final newListing = Listing.fromJson(data);
      print(
        '[ListingsProvider] Parsed listing - id: ${newListing.id}, brokerId: ${newListing.brokerId}',
      );
      _listings.add(newListing);

      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateListing(Listing listing) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.put(
        '${ApiConfig.listingsUrl}/${listing.id}',
        data: listing.toJson(),
      );
      final updatedListing = Listing.fromJson(data);
      final index = _listings.indexWhere((l) => l.id == listing.id);
      if (index != -1) {
        _listings[index] = updatedListing;
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteListing(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await apiClient.delete('${ApiConfig.listingsUrl}/$id');
      _listings.removeWhere((listing) => listing.id == id);

      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Aggregated metrics
  int get totalListingsCount => _listings.fold(0, (sum, l) => sum + l.quantity);
  int get activeListingsCount =>
      activeListings.fold(0, (sum, l) => sum + l.quantity);
  double get totalPropertyValue =>
      _listings.fold(0.0, (sum, l) => sum + (l.price ?? 0));
}

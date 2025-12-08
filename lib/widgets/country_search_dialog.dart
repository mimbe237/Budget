import 'package:flutter/material.dart';
import 'package:budget/l10n/localization_helpers.dart';
import 'package:budget/constants/countries_by_language.dart';

class CountrySearchDialog extends StatefulWidget {
  final List<Map<String, String>> countries;
  final String selectedCode;
  final String languageCode;

  const CountrySearchDialog({
    super.key,
    required this.countries,
    required this.selectedCode,
    required this.languageCode,
  });

  @override
  State<CountrySearchDialog> createState() => _CountrySearchDialogState();
}

class _CountrySearchDialogState extends State<CountrySearchDialog> {
  final TextEditingController _searchController = TextEditingController();
  List<Map<String, String>> _filteredCountries = [];

  @override
  void initState() {
    super.initState();
    _updateFilteredCountries();
    _searchController.addListener(_filterCountries);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _updateFilteredCountries() {
    setState(() {
      if (_searchController.text.isEmpty) {
        // Afficher seulement les pays autorisés
        _filteredCountries = widget.countries
            .where((country) => AllowedCountries.codes.contains(country['code']))
            .toList();
      }
    });
  }

  void _filterCountries() {
    final query = _searchController.text.toLowerCase();
    
    setState(() {
      if (query.isEmpty) {
        _filteredCountries = widget.countries
            .where((country) => AllowedCountries.codes.contains(country['code']))
            .toList();
      } else {
        // Recherche dans tous les pays autorisés
        _filteredCountries = widget.countries.where((country) {
          if (!AllowedCountries.codes.contains(country['code'])) return false;
          
          final name = widget.languageCode == 'en' 
              ? (country['nameEn'] ?? country['name']!).toLowerCase()
              : country['name']!.toLowerCase();
          final dial = country['dial']!.toLowerCase();
          return name.contains(query) || dial.contains(query);
        }).toList();
      }
    });
  }

  String _getCountryName(Map<String, String> country) {
    return widget.languageCode == 'en' 
        ? (country['nameEn'] ?? country['name']!)
        : country['name']!;
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxHeight: 600, maxWidth: 400),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF6C5CF7),
                    const Color(0xFFC542C1),
                  ],
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const TrText(
                        'Sélectionner un pays',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close, color: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Search field
                  TextField(
                    controller: _searchController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: widget.languageCode == 'en' 
                          ? 'Search country or dial code...'
                          : 'Rechercher pays ou indicatif...',
                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.7)),
                      prefixIcon: const Icon(Icons.search, color: Colors.white),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, color: Colors.white),
                              onPressed: () {
                                _searchController.clear();
                                _filterCountries();
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.2),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Countries list
            Expanded(
              child: _filteredCountries.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.search_off,
                            size: 48,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                          TrText(
                            widget.languageCode == 'en'
                                ? 'No country found'
                                : 'Aucun pays trouvé',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: _filteredCountries.length,
                      itemBuilder: (context, index) {
                        final country = _filteredCountries[index];
                        final isSelected = country['code'] == widget.selectedCode;
                        
                        return ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? const Color(0xFF6C5CF7).withOpacity(0.1)
                                  : Colors.grey[100],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              country['dial']!,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: isSelected
                                    ? const Color(0xFF6C5CF7)
                                    : Colors.grey[700],
                              ),
                            ),
                          ),
                          title: Text(
                            _getCountryName(country),
                            style: TextStyle(
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              color: isSelected ? const Color(0xFF6C5CF7) : Colors.black87,
                            ),
                          ),
                          trailing: isSelected
                              ? const Icon(
                                  Icons.check_circle,
                                  color: Color(0xFF6C5CF7),
                                )
                              : null,
                          selected: isSelected,
                          selectedTileColor: const Color(0xFF6C5CF7).withOpacity(0.05),
                          onTap: () => Navigator.pop(context, country['code']),
                        );
                      },
                    ),
            ),
            // Footer
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: Colors.grey[300]!),
                ),
              ),
              child: Text(
                '${_filteredCountries.length} ${widget.languageCode == 'en' ? 'countries' : 'pays'}',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

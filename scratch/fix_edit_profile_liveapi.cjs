const fs = require('fs');
const filePath = 'apps/mobile/lib/screens/profile/edit_profile_screen.dart';
let src = fs.readFileSync(filePath, 'utf8');

src = src.replace(
  `    try {\r
      await _profileService.updateProfile(\r
        nickname: nickname,\r
        bio: bio,\r
        country: _selectedCountry,\r
        countryCode: _selectedCountryCode,\r
        gender: _selectedGender,\r
      );\r
      await AuthState.instance.restoreSession();\r
    } catch (_) {}`,
  `    if (ApiConfig.useLiveApi) {\r
      try {\r
        await _profileService.updateProfile(\r
          nickname: nickname,\r
          bio: bio,\r
          country: _selectedCountry,\r
          countryCode: _selectedCountryCode,\r
          gender: _selectedGender,\r
        );\r
        await AuthState.instance.restoreSession();\r
      } catch (_) {}\r
    }`
);

// Fallback for LF
src = src.replace(
  `    try {\n      await _profileService.updateProfile(\n        nickname: nickname,\n        bio: bio,\n        country: _selectedCountry,\n        countryCode: _selectedCountryCode,\n        gender: _selectedGender,\n      );\n      await AuthState.instance.restoreSession();\n    } catch (_) {}`,
  `    if (ApiConfig.useLiveApi) {\n      try {\n        await _profileService.updateProfile(\n          nickname: nickname,\n          bio: bio,\n          country: _selectedCountry,\n          countryCode: _selectedCountryCode,\n          gender: _selectedGender,\n        );\n        await AuthState.instance.restoreSession();\n      } catch (_) {}\n    }`
);

fs.writeFileSync(filePath, src, 'utf8');
console.log('Successfully updated edit_profile_screen.dart with useLiveApi guard');

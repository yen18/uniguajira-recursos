# Release signing for Android APK

You can sign the release APK using a Java keystore. This folder contains helper scripts to generate a keystore and configure Gradle to use it.

## Option A: Use the helper PowerShell script (Windows)

Run this from a PowerShell terminal:

```
cd C:\xampp\htdocs\yen\yen\frontend\android\signing
./setup-signing.ps1
```

The script will:
- Create `keystore.jks` in this folder (unless it exists)
- Prompt you for alias and passwords
- Append these properties to `..\\gradle.properties`:
  - RELEASE_STORE_FILE
  - RELEASE_STORE_PASSWORD
  - RELEASE_KEY_ALIAS
  - RELEASE_KEY_PASSWORD

After that, rebuild the release APK:

```
cd ..
./gradlew.bat clean assembleRelease
```

The signed APK will be at:
```
app\\build\\outputs\\apk\\release\\app-release.apk
```

## Option B: Manual keystore creation

```
keytool -genkeypair -v -keystore keystore.jks -alias yen-release -keyalg RSA -keysize 2048 -validity 3650
```

Then add these lines to `android/gradle.properties` (replace with your values):

```
RELEASE_STORE_FILE=C:\\xampp\\htdocs\\yen\\yen\\frontend\\android\\signing\\keystore.jks
RELEASE_STORE_PASSWORD=your-store-pass
RELEASE_KEY_ALIAS=yen-release
RELEASE_KEY_PASSWORD=your-key-pass
```

Rebuild with `./gradlew.bat assembleRelease`.

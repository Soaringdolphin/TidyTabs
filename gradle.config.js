module.exports = {
  // This function allows you to modify the app's build.gradle file
  modifyAppBuildGradle: (config) => {
    // Force the compose compiler version to be 1.5.4
    if (!config.includes('kotlinCompilerExtensionVersion = "1.5.4"')) {
      config = config.replace(
        /android\s*\{/,
        `android {
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.4"
    }`
      );
    }
    
    // Ensure JVM compatibility settings
    if (!config.includes('compileOptions')) {
      config = config.replace(
        /android\s*\{/,
        `android {
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    
    kotlinOptions {
        jvmTarget = "17"
    }`
      );
    }
    
    // Make sure we have the correct compose compiler dependency
    if (!config.includes('androidx.compose.compiler:compiler:1.5.4')) {
      config = config.replace(
        /dependencies\s*\{/,
        `dependencies {
    // Androidx Compose compiler compatible with Kotlin 1.9.20
    implementation("androidx.compose.compiler:compiler:1.5.4")`
      );
    }
    
    return config;
  },
  
  // Modify project-level build.gradle to ensure consistent Kotlin version
  modifyProjectBuildGradle: (config) => {
    // Ensure consistent Kotlin version
    if (!config.includes('kotlinVersion = ')) {
      config = config.replace(
        /buildscript\s*\{\s*ext\s*\{/,
        `buildscript {
    ext {
        kotlinVersion = "1.9.20"`
      );
    } else {
      // Replace existing kotlinVersion
      config = config.replace(
        /kotlinVersion\s*=\s*.*?,/,
        `kotlinVersion = "1.9.20",`
      );
    }
    
    return config;
  }
}; 
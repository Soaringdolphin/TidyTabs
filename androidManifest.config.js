module.exports = {
  // This function is called during prebuild to enhance or modify the AndroidManifest.xml
  modifyAndroidManifest: ({ manifest }) => {
    // You can modify the manifest here if needed
    return manifest;
  },
  
  // This ensures our build settings are preserved during prebuild
  // We're specifying this explicitly to ensure our settings are kept
  android: {
    // Keep the Kotlin and Compose compiler versions consistent
    kotlinVersion: '1.9.20',
    kotlinCompilerExtensionVersion: '1.5.4',
    
    // Set correct SDK versions
    compileSdkVersion: 34,
    buildToolsVersion: '34.0.0',
    
    // Keep our namespace and package
    package: 'io.github.Soaringdolphin.tidytabs',
    
    // Ensure we're using the specified Firebase dependencies
    dependencies: {
      // Ensure Firebase BoM is consistent
      implementation: [
        'platform("com.google.firebase:firebase-bom:32.6.0")',
        '"com.google.firebase:firebase-analytics"',
        '"com.google.firebase:firebase-auth"',
        '"com.google.firebase:firebase-firestore"',
        '"androidx.compose.compiler:compiler:1.5.4"'
      ]
    },
    
    // Add compile options to ensure Java/Kotlin compatibility
    compileOptions: {
      sourceCompatibility: 'JavaVersion.VERSION_17',
      targetCompatibility: 'JavaVersion.VERSION_17'
    },
    
    // Ensure Kotlin JVM target is consistent
    kotlinOptions: {
      jvmTarget: '17'
    }
  }
}; 
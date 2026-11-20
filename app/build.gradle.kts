plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Jeder GitHub-Build bekommt automatisch eine höhere Versionsnummer
val buildNumber = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull() ?: 1

android {
    namespace = "de.marween.dreamlightguide"
    compileSdk = 35

    defaultConfig {
        applicationId = "de.marween.dreamlightguide"
        minSdk = 26
        targetSdk = 34
        versionCode = buildNumber
        versionName = "1.0.$buildNumber"
    }

    // Fester Schlüssel, damit neue Versionen als Update installiert werden können
    signingConfigs {
        create("release") {
            storeFile = file("dreamlight.keystore")
            storePassword = "dreamlight-marween"
            keyAlias = "dreamlight"
            keyPassword = "dreamlight-marween"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            signingConfig = signingConfigs.getByName("release")
        }
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("com.google.mlkit:translate:17.0.3")
}

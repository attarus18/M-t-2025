# Regole R8 per la build di release (minifyEnabled true).
# Prudenti: si tengono per intero i package chiamati dal bridge JS di Capacitor
# via reflection; R8 rimuove comunque il codice inutilizzato delle librerie Google.

-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,SourceFile,LineNumberTable

# Capacitor: bridge, plugin core e plugin annotati
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
    @android.webkit.JavascriptInterface <methods>;
}

# Plugin usati dall'app
-keep class com.capacitorjs.plugins.** { *; }
-keep class com.getcapacitor.community.admob.** { *; }
-keep class ee.forgr.nativepurchases.** { *; }
-keep class com.android.billingclient.** { *; }

# Activity dell'app
-keep class attarus18.meteozoo.com.** { *; }

-dontwarn com.google.errorprone.annotations.**
-dontwarn javax.annotation.**
-dontwarn org.jetbrains.annotations.**

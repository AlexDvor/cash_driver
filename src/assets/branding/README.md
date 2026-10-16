# CashDriver app icon

Owner-selected generated artwork: car with euro coin, green background.
`cashdriver-app-icon.png` is the opaque 1024px master used for native exports.

Android: legacy launcher/round PNGs in five mipmap densities; API 26+ adaptive XML uses a solid sampled background and a foreground raster with the empty green outer margin feathered to transparency containing the complete artwork at 60dp inside a 108dp canvas. The inset preserves the wide car under launcher masks. No separate themed monochrome variant is supplied.
iOS: the active CashDriver AppIcon catalog contains opaque iPhone, iPad and 1024px marketing PNGs. System applies the corner mask. The obsolete TempApp catalog is not used by CashDriver and is unchanged.

Resize from this master with Lanczos filtering when regenerating. Native launcher appearance and iOS asset compilation require device/Xcode verification.

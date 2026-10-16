#import <React/RCTBridgeModule.h>

@interface CashDriverAppVersion : NSObject <RCTBridgeModule>
@end

@implementation CashDriverAppVersion
RCT_EXPORT_MODULE(CashDriverAppVersion)
+ (BOOL)requiresMainQueueSetup { return NO; }
- (NSDictionary *)constantsToExport {
  NSDictionary *info = NSBundle.mainBundle.infoDictionary;
  return @{
    @"version": info[@"CFBundleShortVersionString"] ?: NSNull.null,
    @"build": info[@"CFBundleVersion"] ?: NSNull.null,
  };
}
@end

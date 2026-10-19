#import <React/RCTBridgeModule.h>
#import <CoreLocation/CoreLocation.h>

// Permission-only bridge: requesting authorization must not start location updates.
@interface CashDriverLocationPermission : NSObject <RCTBridgeModule, CLLocationManagerDelegate>
@property(nonatomic, strong) CLLocationManager *manager;
@property(nonatomic, strong) NSMutableArray *pending;
@end

@implementation CashDriverLocationPermission
RCT_EXPORT_MODULE(CashDriverLocationPermission)
+ (BOOL)requiresMainQueueSetup { return NO; }
- (dispatch_queue_t)methodQueue { return dispatch_get_main_queue(); }
RCT_REMAP_METHOD(isAuthorized,
                 isAuthorizedWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  CLAuthorizationStatus status = [CLLocationManager authorizationStatus];
  resolve(@(status == kCLAuthorizationStatusAuthorizedWhenInUse ||
            status == kCLAuthorizationStatusAuthorizedAlways));
}

RCT_REMAP_METHOD(requestAuthorization,
                 requestAuthorizationWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  CLAuthorizationStatus status = [CLLocationManager authorizationStatus];
  if (status != kCLAuthorizationStatusNotDetermined) {
    resolve(@(status == kCLAuthorizationStatusAuthorizedWhenInUse ||
              status == kCLAuthorizationStatusAuthorizedAlways));
    return;
  }
  if (!self.pending) self.pending = [NSMutableArray new];
  [self.pending addObject:[resolve copy]];
  if (!self.manager) {
    self.manager = [CLLocationManager new];
    self.manager.delegate = self;
  }
  [self.manager requestWhenInUseAuthorization];
}

- (void)locationManagerDidChangeAuthorization:(CLLocationManager *)manager {
  CLAuthorizationStatus status = manager.authorizationStatus;
  if (status == kCLAuthorizationStatusNotDetermined) return;
  BOOL authorized = status == kCLAuthorizationStatusAuthorizedWhenInUse ||
                    status == kCLAuthorizationStatusAuthorizedAlways;
  for (RCTPromiseResolveBlock callback in self.pending) callback(@(authorized));
  [self.pending removeAllObjects];
}
@end

#import <React/RCTBridgeModule.h>
#import <React/RCTInvalidating.h>
#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@interface CashDriverConfirmationSound : NSObject <RCTBridgeModule, RCTInvalidating, AVAudioPlayerDelegate>
@property(nonatomic, strong) AVAudioPlayer *player;
@end

@implementation CashDriverConfirmationSound
RCT_EXPORT_MODULE(CashDriverConfirmationSound)
+ (BOOL)requiresMainQueueSetup { return NO; }
- (dispatch_queue_t)methodQueue { return dispatch_get_main_queue(); }

RCT_EXPORT_METHOD(play) {
  if (UIApplication.sharedApplication.applicationState != UIApplicationStateActive) return;
  NSError *error = nil;
  AVAudioSession *session = AVAudioSession.sharedInstance;
  // Ambient mixes with other audio and respects the device's Silent switch.
  if (![session setCategory:AVAudioSessionCategoryAmbient error:&error]) return;
  if (!self.player) {
    NSURL *url = [NSBundle.mainBundle URLForResource:@"payment_confirmation" withExtension:@"wav"];
    if (!url) return;
    self.player = [[AVAudioPlayer alloc] initWithContentsOfURL:url error:&error];
    if (!self.player) return;
    self.player.delegate = self;
    self.player.volume = 0.6;
    [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(stop)
      name:UIApplicationWillResignActiveNotification object:nil];
  }
  if (![session setActive:YES error:&error]) return;
  [self.player stop];
  self.player.currentTime = 0;
  if (![self.player play]) [self stop];
}

- (void)stop {
  [self.player stop];
  [AVAudioSession.sharedInstance setActive:NO withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation error:nil];
}
- (void)audioPlayerDidFinishPlaying:(AVAudioPlayer *)player successfully:(BOOL)flag { [self stop]; }
- (void)audioPlayerDecodeErrorDidOccur:(AVAudioPlayer *)player error:(NSError *)error { [self stop]; }
- (void)invalidate {
  dispatch_async(dispatch_get_main_queue(), ^{ [self stop]; [NSNotificationCenter.defaultCenter removeObserver:self]; });
}
@end

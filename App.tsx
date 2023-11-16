import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, PermissionsAndroid, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import REFS from 'react-native-fs';
import RNSensors from 'react-native-sensors';
import { Camera, CameraCaptureError, VideoFile, useCameraDevices } from 'react-native-vision-camera';

function App(): JSX.Element {
  const devices = useCameraDevices();
  const device = devices.back;
  const camera = useRef<Camera>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(true);
  const [imageSource, setImageSource] = useState('');
  const [videoSource, setVideoSource] = useState('');
  const destinationPhotoPath = REFS.ExternalDirectoryPath + '/capturedPhoto.jpg';
  const destinationVideoPath = REFS.ExternalDirectoryPath + '/capturedVideo.mp4';
  const [isRecording, setIsRecording] = useState(false);
  const [orientation, setOrientation] = useState({ qx: 0, qy: 0, qz: 0 });

  useEffect(() => {
    
    const orientationSubscription = RNSensors.orientation.subscribe(({ qx, qy, qz }) => {
      setOrientation({ qx, qy, qz });
    });

    return () => {
      orientationSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    (async () => {
      // Check camera permissions:
      const newCameraPermission = await Camera.requestCameraPermission();
      const newMicrophonePermission = await Camera.requestMicrophonePermission();

      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Cool Photo App Camera Permission',
            message: 'Your app needs permission.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          console.log('Camera permission denied');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    })();
  }, []);

  const captureMedia = async () => {
    if (camera.current !== null) {
      try {
        // Stop video recording if in progress
        if (isRecording) {
          await camera.current.stopRecording();
          setIsRecording(false);
        }

        if (isCapturingPhoto) {
          // Capture Photo
          const photo = await camera.current.takePhoto({});
          setImageSource(photo.path);

          try {
            // Copy the captured photo to the destination path.
            await REFS.copyFile(photo.path, destinationPhotoPath);
            console.log('Photo saved:', destinationPhotoPath);
          } catch (error) {
            console.error('Error saving the photo:', error);
          }
        } else {
          // Start Video Recording
          await camera.current.startRecording({
            onRecordingError: (error: CameraCaptureError) => {
              console.error('Error recording video:', error);
            },
            
            onRecordingFinished: async (videoFile: VideoFile) => {
              setVideoSource(videoFile.path);

              try {
                // Copy the recorded video to the destination path.
                await REFS.copyFile(videoFile.path, destinationVideoPath);
                console.log('Video saved:', destinationVideoPath);
              } catch (error) {
                console.error('Error saving the video:', error);
              }
            },
          });
          setIsRecording(true);
        }
      } catch (error) {
        console.error('Error capturing media:', error);
      }
    }
  };
  const toggleCaptureMode = () => {
    // Toggle between capturing a photo and capturing a video
    setIsCapturingPhoto((prev) => !prev);
  };


  if (device == null) return <ActivityIndicator />;

  return (
    <View style={styles.all}>
      <View style={styles.camera}>
        <Camera ref={camera} style={StyleSheet.absoluteFillObject} device={device} isActive={true} photo={true} video={true} zoom={1} />
      </View>
      <View style={styles.captureButtonContainer}>
        <TouchableOpacity onPress={captureMedia} style={styles.captureButton}>
          <Text style={{ fontSize: 14, color: 'white' }}>{isCapturingPhoto ? ' Photo' : 'Video'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleCaptureMode} style={styles.toggleButton}>
          <Text style={{ fontSize: 14, color: 'white' }}>{isCapturingPhoto ? 'Switch to Video' : 'Switch to Photo'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.orientationContainer}>
        <Text style={styles.orientationText}>X: {orientation.qx.toFixed(2)}</Text>
        <Text style={styles.orientationText}>Y: {orientation.qy.toFixed(2)}</Text>
        <Text style={styles.orientationText}>Z: {orientation.qz.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  all: {
    flex: 1,
  },
  camera: {
    flex: 1,
    alignItems: 'center',
  },
  captureButtonContainer: {
    position: 'absolute',
    top: 20,
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: 'blue',
    paddingVertical: 15,
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  toggleButton: {
    backgroundColor: 'red',
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  orientationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  orientationText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 5,
  },
});

export default App;

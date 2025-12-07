// src/pages/Sermons.jsx
import { useState, useEffect, useRef } from 'react';
import { IonContent, IonPage, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/react';
import {
  playCircleOutline,
  pauseCircleOutline,
  playSkipBackOutline,
  playSkipForwardOutline,
  volumeHighOutline,
  downloadOutline,
  arrowBackOutline,
  closeOutline,
  videocamOutline,
  musicalNotesOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';
import './Sermons.css';

const Sermons = () => {
  const history = useHistory();
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSermon, setSelectedSermon] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [filter, setFilter] = useState('all');
  
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchSermons();
  }, []);

  const fetchSermons = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'sermons'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const sermonsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSermons(sermonsData);
    } catch (error) {
      console.error('Error fetching sermons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event) => {
    await fetchSermons();
    event.detail.complete();
  };

  const openPlayer = (sermon) => {
    setSelectedSermon(sermon);
    setShowPlayer(true);
    setPlaying(false);
    setCurrentTime(0);
  };

  const closePlayer = () => {
    if (audioRef.current) audioRef.current.pause();
    if (videoRef.current) videoRef.current.pause();
    setShowPlayer(false);
    setPlaying(false);
    setTimeout(() => setSelectedSermon(null), 300);
  };

  const togglePlayPause = () => {
    const media = selectedSermon?.type === 'video' ? videoRef.current : audioRef.current;
    if (!media) return;

    if (playing) {
      media.pause();
    } else {
      media.play();
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    const media = selectedSermon?.type === 'video' ? videoRef.current : audioRef.current;
    if (media) {
      setCurrentTime(media.currentTime);
      setDuration(media.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const media = selectedSermon?.type === 'video' ? videoRef.current : audioRef.current;
    if (!media) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    media.currentTime = percentage * duration;
  };

  const skipTime = (seconds) => {
    const media = selectedSermon?.type === 'video' ? videoRef.current : audioRef.current;
    if (media) {
      media.currentTime += seconds;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredSermons = filter === 'all' 
    ? sermons 
    : sermons.filter(s => s.type === filter);

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="sermons-container">
          {/* Header */}
          <div className="sermons-header">
            <button className="back-button" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <h1 className="sermons-title">Sermons</h1>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-tab ${filter === 'audio' ? 'active' : ''}`}
              onClick={() => setFilter('audio')}
            >
              <IonIcon icon={musicalNotesOutline} />
              Audio
            </button>
            <button
              className={`filter-tab ${filter === 'video' ? 'active' : ''}`}
              onClick={() => setFilter('video')}
            >
              <IonIcon icon={videocamOutline} />
              Video
            </button>
          </div>

          {/* Sermons List */}
          <div className="sermons-content">
            {loading ? (
              <div className="skeleton-container">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton-sermon">
                    <div className="skeleton skeleton-avatar" style={{ borderRadius: '12px' }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton skeleton-title" />
                      <div className="skeleton skeleton-text" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSermons.length > 0 ? (
              <div className="sermons-list">
                {filteredSermons.map((sermon, index) => (
                  <div
                    key={sermon.id}
                    className="sermon-card stagger-item hover-lift"
                    onClick={() => openPlayer(sermon)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="sermon-thumbnail">
                      {sermon.thumbnail ? (
                        <img src={sermon.thumbnail} alt={sermon.title} />
                      ) : (
                        <div className="thumbnail-placeholder">
                          <IonIcon icon={sermon.type === 'video' ? videocamOutline : musicalNotesOutline} />
                        </div>
                      )}
                      <div className="play-overlay">
                        <IonIcon icon={playCircleOutline} />
                      </div>
                      <span className="sermon-type-badge">
                        {sermon.type === 'video' ? 'Video' : 'Audio'}
                      </span>
                    </div>
                    <div className="sermon-info">
                      <h3 className="sermon-title">{sermon.title}</h3>
                      <p className="sermon-speaker">{sermon.speaker || 'Pastor'}</p>
                      <div className="sermon-meta">
                        <span className="sermon-date">{formatDate(sermon.createdAt)}</span>
                        {sermon.duration && (
                          <span className="sermon-duration">{sermon.duration}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state animate-fade-in">
                <IonIcon icon={playCircleOutline} className="empty-icon" />
                <h3 className="empty-title">No Sermons Found</h3>
                <p className="empty-text">Check back later for new content</p>
              </div>
            )}
          </div>
        </div>

        {/* Media Player Modal */}
        {showPlayer && selectedSermon && (
          <div className={`player-modal ${showPlayer ? 'active' : ''}`}>
            <div className="player-container">
              <button className="player-close-btn" onClick={closePlayer}>
                <IonIcon icon={closeOutline} />
              </button>

              {/* Media Display */}
              <div className="media-display">
                {selectedSermon.type === 'video' ? (
                  <video
                    ref={videoRef}
                    src={selectedSermon.url}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                    className="video-player"
                  />
                ) : (
                  <div className="audio-artwork">
                    {selectedSermon.thumbnail ? (
                      <img src={selectedSermon.thumbnail} alt={selectedSermon.title} />
                    ) : (
                      <div className="artwork-placeholder">
                        <IonIcon icon={musicalNotesOutline} />
                      </div>
                    )}
                  </div>
                )}
                {selectedSermon.type === 'audio' && (
                  <audio
                    ref={audioRef}
                    src={selectedSermon.url}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                  />
                )}
              </div>

              {/* Player Info */}
              <div className="player-info">
                <h2 className="player-title">{selectedSermon.title}</h2>
                <p className="player-speaker">{selectedSermon.speaker || 'Pastor'}</p>
              </div>

              {/* Progress Bar */}
              <div className="progress-section">
                <div className="progress-bar" onClick={handleSeek}>
                  <div
                    className="progress-fill"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                <div className="time-display">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="player-controls">
                <button className="control-btn" onClick={() => skipTime(-15)}>
                  <IonIcon icon={playSkipBackOutline} />
                  <span className="skip-time">15s</span>
                </button>

                <button className="play-pause-btn" onClick={togglePlayPause}>
                  <IonIcon icon={playing ? pauseCircleOutline : playCircleOutline} />
                </button>

                <button className="control-btn" onClick={() => skipTime(15)}>
                  <IonIcon icon={playSkipForwardOutline} />
                  <span className="skip-time">15s</span>
                </button>
              </div>

              {/* Additional Controls */}
              <div className="additional-controls">
                <button className="icon-btn">
                  <IonIcon icon={volumeHighOutline} />
                </button>
                <button className="icon-btn">
                  <IonIcon icon={downloadOutline} />
                </button>
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Sermons;
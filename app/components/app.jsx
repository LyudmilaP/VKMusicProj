import React, { Component, PropTypes } from 'react';
import MenuSection from './menu/menu_section.jsx';
import PlayerSection from './player/player_section.jsx';
import AudioList from './audios/audio_list.jsx';
// import InfiniteScroll from 'react-infinite-scroller';

var css = require('./style.styl');

var audios_array = [];
var search_result = [];
var user_id = [];

function vk_getaudios (offset,callback) {
  console.log('::: current audios count ->   ',offset);

  VK.Api.call('audio.get', {count: 30, offset:offset, v:"5.52"}, function(r) { 

    if(r.error) {
      console.log("audio.get error ->" + JSON.stringify(r.error));
      return;
    } 

    console.log('::: reponse ->',r.response.count);

    audios_array = r.response.items;

    callback(audios_array,r.response.count);
  }.bind(this)); 
}

function vk_searchaudio (query,callback) {
  VK.Api.call('audio.search', {q: query}, function(r) { 

    if(r.error) {
        console.log("audio.search error ->" + JSON.stringify(r.error));
    } else {

        search_result = r.response;
        search_result.shift();
        callback(search_result);
    }
  }); 
}

function vk_getrecommend (callback) {
  VK.Api.call('audio.getRecommendations', {user_id: user_id, count: 100, v:"5.52"}, function(r) { 

      if(r.error) {
        console.log("audio.getRecommendations error ->" + JSON.stringify(r.error));
      } else {
        search_result = r.response.items;
        callback(search_result);
      }
  }); 
}

function vk_getuserphoto (callback) {
  VK.Api.call('users.get', {fields: 'photo_200'}, function(r) { 

    if(r.error) {
      console.log("users.get error ->" + JSON.stringify(r.error));
    } else {

      var user = r.response;

      console.log('Данные пользователя ' + JSON.stringify(user[0]));
      callback(user[0]);
    }
  }); 
}

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      ButtonValue: '▶',
      Audiolist: [],
      Audiourl: '',
      Playing: false,
      CurrentQuery: '',
      User_id: 0,
      ImageUrl: '',
      UserFirstName: '',
      UserLastName: '',
      IsAuth:false,
      OffsetCounter: 0,
      TotalCountAudios: 0,
      CurrentArtist: '',
      CurrentTitle: ''
    };
  }

  HandleLoadAudios() {
    var offset = this.state.OffsetCounter;

    if (this.state.Audiolist.length != 0) {
      offset += 30
    } 

    if (this.state.TotalCountAudios > 0) {

        if (offset < this.state.TotalCountAudios) {

            vk_getaudios(offset,function (audiosArray,totalcount){
            if (audiosArray) {

              var currentAudioList = this.state.Audiolist;

              console.log(':::: currentAudioList -> ',currentAudioList);
              console.log(':::: audiosArray -> ',audiosArray);

              var resarr =  currentAudioList.concat(audiosArray);

              console.log(':::: resArray -> ',resarr);

              this.setState( {Audiolist: resarr,OffsetCounter:offset,TotalCountAudios:totalcount} );
            }
          }.bind(this))
        }
    } else {

      vk_getaudios(0,function (audiosArray,totalcount){

        if (audiosArray) {

          var currentAudioList = this.state.Audiolist;

          console.log(':::: currentAudioList -> ',currentAudioList);
          console.log(':::: audiosArray -> ',audiosArray);

          var resarr =  currentAudioList.concat(audiosArray);

          console.log(':::: resArray -> ',resarr);

          this.setState( {Audiolist: resarr,
                          OffsetCounter:offset,
                          TotalCountAudios:totalcount,
                          CurrentArtist: resarr[0].artist,
                          CurrentTitle: resarr[0].title,
                          CurrentPlayedAudioModel: resarr[0],
                          Audiourl: resarr[0].url} )
        }
      }.bind(this))
    }
  }

  HandleLoadRecommendations() {
    vk_getrecommend(function(RecArray) {
          if (RecArray) {
            this.setState( {Audiolist: RecArray} );
          }
        }.bind(this));
  }

  handleUpdatePlaying(audiomodel) {
    if(this.state.CurrentPlayedAudioModel.id !== audiomodel.id) {

      this.setState( {  

                      Audiourl: audiomodel.url,
                      CurrentPlayedAudioModel:audiomodel, 
                      playing: true, 
                      ButtonValue: '||',
                      CurrentArtist: audiomodel.artist,
                      CurrentTitle: audiomodel.title

                      } );
    } else {
      this.playPause();
    }
  }

  playPause() {
    this.setState( {playing: !this.state.playing, ButtonValue: this.state.playing ? '▶' : '||'} );
  }

  GetUserData() {
    vk_getuserphoto(function (userData){

      if (userData) {
        this.setState( {
                IsAuth:true,
                User_id: userData.uid,
                ImageUrl: userData.photo_200, 
                UserFirstName: userData.first_name, 
                UserLastName: userData.last_name} );
        user_id = userData.uid;
      }
    }.bind(this))
  }

  nextAudioByEnd() {
    this.playNextAudio();
  }

  playNextAudio() {
    var audiolist = this.state.Audiolist;
    var indexLastPlayedAudio = audiolist.indexOf(this.state.CurrentPlayedAudioModel);

    if (indexLastPlayedAudio === audiolist.length - 1 ) {

      var audiomodel = audiolist[0];

    } else {

      var audiomodel = audiolist[indexLastPlayedAudio+1];
    }

    this.handleUpdatePlaying(audiomodel);
  }

  playPrevAudio() {
    var audiolist = this.state.Audiolist;
    var indexLastPlayedAudio = audiolist.indexOf(this.state.CurrentPlayedAudioModel);

    if (indexLastPlayedAudio === 0) {

      var audiomodel = audiolist[audiolist.length - 1];

    } else {

      var audiomodel = audiolist[indexLastPlayedAudio-1];
    }

    this.handleUpdatePlaying(audiomodel);
  }

  OnChangeAudioSearchQuery(query) {
      if (query != '') {
        vk_searchaudio(query,function(audio_list) {
          if (audio_list) {
            this.setState( {Audiolist: audio_list} );
          }
        }.bind(this));

    } else {
      this.HandleLoadAudios();
    }
  } 

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
     window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll() {
    let body = document.body;
    let html = document.documentElement;

    let scrollSize = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    let scrollOffset = body.scrollTop;
    let windowHeight = window.innerHeight;
    let scroll_position = scrollSize - scrollOffset - windowHeight;

    console.log('value -> ', scroll_position);
    console.log('value scrollSize -> ', scrollSize);
    console.log('value scrollOffset -> ', scrollOffset)
    console.log('value windowHeight -> ', windowHeight);

    if (scroll_position < 200) {
      console.log(':::: LOAD MORE :::::');
      this.refs.audiolist.HandleLoadAudios();
    } 
  }

  render() {
    return (
      <div>
        <MenuSection 
          {...this.state} 
          {...this.props} 
          HandleLoadRecommendations={this.HandleLoadRecommendations.bind(this)}
          HandleLoadAudios={this.HandleLoadAudios.bind(this)}
          GetUserData={this.GetUserData.bind(this)}
        />
        <PlayerSection 
          {...this.state}
          {...this.props}
          playPause={this.playPause.bind(this)}
          nextAudioByEnd={this.nextAudioByEnd.bind(this)}
          OnChangeAudioSearchQuery={this.OnChangeAudioSearchQuery.bind(this)}
          playPrevAudio={this.playPrevAudio.bind(this)}
          playNextAudio={this.playNextAudio.bind(this)}

        />
        <AudioList 
          {...this.state} 
          {...this.props} 
          ref="audiolist"
          HandleLoadAudios={this.HandleLoadAudios.bind(this)}
          handleUpdatePlaying={this.handleUpdatePlaying.bind(this)}
        />
      </div>
    )
  }
}

export default App

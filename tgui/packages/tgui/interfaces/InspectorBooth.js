/**
 * @file
 * @copyright 2023 Kaithyl (https://github.com/kaithyl)
 * @license MIT
 */

// I would have moved all the inline CSS into a style sheet
// but tgui-dev doesn't hot reload .scss files

import { Component } from 'inferno';
import { resolveAsset } from '../assets';
import { useBackend, useSharedState } from '../backend';
import { Window } from '../layouts';

import { Draggable } from '../components/Draggable';
import DOMPurify from 'dompurify';

class Stamp extends Component {
  constructor(props) {
    super(props);
    this.icon = props.icon;
    this.type = props.type ?? this.icon.toString();
    // Necessary in ES6
    this.handleClick = this.handleClick.bind(this);
  }

  // Fixes stuck buttons when client closes before timeout
  componentDidMount() {
    const [active, setActive] = useSharedState(this.context, this.type+"_active", false);
    const [timer] = useSharedState(this.context, this.type+"_timer", false);
    const { act, config } = useBackend(this.context);
    if (active && new Date().getTime() - timer > 500) {
      setActive(false);
      act('play_sfx', { name: 'stamp_up', ckey: config.client?.ckey });
    }
  }

  handleClick() {
    const [active, setActive] = useSharedState(this.context, this.type+"_active", false);
    const [, setTimer] = useSharedState(this.context, this.type+"_timer", new Date().getTime());
    if (active) { return; }
    const { act, config } = useBackend(this.context);
    setActive(true);
    act('play_sfx', { name: 'stamp_down', ckey: config.client?.ckey });
    setTimeout(() => {
      setActive(false);
      act('play_sfx', { name: 'stamp_up', ckey: config.client?.ckey });
    }, 500);
    setTimer(new Date().getTime());
  }

  render() {
    const [active] = useSharedState(this.context, this.type+"_active", false);
    const styles = {
      tray : {
        position: "relative",
        "-ms-interpolation-mode": "nearest-neighbor",
        "margin-left": "-1.23vw",
      },
      tray_cover : {
        width:"9.487vw",
        "pointer-events": "none",
      },
      stamp : {
        "margin-left": "-8.27vw",
        width: "6.9vw",
        "z-index": -1,
        transition: "transform 150ms ease-out 0s",
        "pointer-events": "auto",
      },
      up: { transform: "translateY(0vh)" },
      down: { transform: "translateY(5vh)" },
    };
    return (
      <span>
        <img src={resolveAsset("tray_cover.png")}
            style={{ ...styles.tray, ...styles.tray_cover }} />
        <img src={resolveAsset(this.icon)} onClick={this.handleClick}
            style={{ ...styles.tray, ...styles.stamp, ...active ? styles.down : styles.up }} />
      </span>
    );
  }
}

class StampTray extends Component {
  constructor(props) {
    super(props);
    this.end_width = 5.14;
    this.slide_width = -31.65;

    // Necessary in ES6
    this.initRef = this.initRef.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
  }

  // i hate frontend
  initRef(ref) {
    this.ref = ref;
    if (this.ref) {
      this.slide_width = -((100*this.ref.getBoundingClientRect().width/window.innerWidth) - this.end_width - 0.2);
    }
  }

  handleToggle() {
    const [active, setActive] = useSharedState(this.context, "tray_active", false);
    const { act, config } = useBackend(this.context);
    this.init = true;
    setActive(prev => !prev);
    act('play_sfx', { name: active ? 'tray_open' : 'tray_close', ckey: config.client?.ckey });
  }

  createSegs(num) {
    const style = {
      position: "relative",
      "-ms-interpolation-mode": "nearest-neighbor",
      width: "6vw",
      "z-index": -1,
    };
    let segs = [];
    for (let i = 0; i < num; i++) {
      segs.push(<img src={resolveAsset("tray_segment.png")} style={style} />);
    }
    return segs;
  }
f
  render() {
    const { data } = useBackend(this.context);
    const { stamps=[] } = data;
    const [active] = useSharedState(this.context, "tray_active", false);
    const [zIndex] = useSharedState(this.context, "zindex", 0);
    const styles = {
      slide : {
        position: "absolute",
        "top": "10vh",
        "z-index": zIndex+100,
        // "margin-bottom": "0.5vh",
        transition: this.init ? "transform 300ms ease-in-out 0s" : "none",
        "pointer-events": "none",
        "box-shadow": "0vw 7vh 0 0 rgba(0, 0, 0, .2)",
      },
      out : { transform: "translateX(0vw)" },
      in : { transform: `translateX(${this.slide_width}vw)` },
      tray_end : {
        width: `${this.end_width}vw`,
        position: "relative",
        "-ms-interpolation-mode": "nearest-neighbor",
        "pointer-events": "auto",
      },
    };
    return (
      <div ref={this.initRef} style={{ ...styles.slide, ...active ? styles.out : styles.in }}>
        {stamps.map(stamp => (
          <span key={stamp.type}>
            { this.createSegs(1) }
            <Stamp type={stamp.type} icon={stamp.icon} />
          </span>
        ))}
        { this.createSegs(1) }
        <img src={resolveAsset("tray_end.png")} style={styles.tray_end} onClick={this.handleToggle} />
      </div>
    );
  }
}

class Paperwork extends Component {
  constructor(props) {
    super(props);
    this.debug = this.props.debug;
    this.id = props.id;
    this.text = props.text ?? " ";
    this.stamps = props.stamps ?? " ";
    this.x = props.x;
    this.y = props.y;
    this.z = props.z;

    // Necessary in ES6
    this.handleOnDrag = this.handleOnDrag.bind(this);
    this.onStopDrag = this.onStopDrag.bind(this);
  }

  // DO NOT REMOVE THIS IS IMPORTANT FOR PREVENTING INJECTION ATTACKS
  sanitizeHTML(input) {
    return DOMPurify.sanitize(input, {
      FORBID_ATTR: ['class', 'style'],
      ALLOWED_TAGS: [
        'br', 'code', 'li', 'p', 'pre', 'span', 'table', 'td', 'tr',
        'th', 'ul', 'ol', 'menu', 'b', 'center', 'table', 'tr', 'th', 'hr',
      ],
    });
  }

  // Technically zindex could hit the integer limit but a round
  // would never be able to last long enough for it to matter
  handleOnDrag(e) {
    const { act, config } = useBackend(this.context);
    const [zIndex, setZIndex] = useSharedState(this.context, "zindex", 0);
    setZIndex(prev => prev+1);
    e.z = zIndex;
    act('play_sfx', { name: 'drag_start', ckey: config.client?.ckey });
  }

  onStopDrag(e) {
    const { dX, dY } = e.state;
    const { act, config } = useBackend(this.context);
    act('move_item', { id: this.id, x: dX, y: dY, z: e.z });
    act('play_sfx', { name: 'drag_stop', ckey: config.client?.ckey });
  }

  render() {
    const styles = {
      // what are style sheets
      text: {
        position: "absolute",
        top: 0,
        left: 0,
        padding: "10%",
        "text-align": "left",
        color: "black",
        "font-size": "2vmin",
        "line-height": "2vmin",
        "overflow-wrap": "break-word",
        "word-wrap": "break-word",
        "word-break": "break-word",
      },
      stamps: {
        position: "absolute",
        bottom: 0,
        left: 0,
        border: "2px solid rgba(255, 0, 0, 1)",
      },
      // Have to use an img because nearest-neighbor/pixelated doesn't affect background-image
      box: {
        position: "absolute",
        top: 0,
        left: 0,
        "-ms-interpolation-mode": "nearest-neighbor",
        "width": "30vw",
        "height": "60vh",
        "order-left-width": "20px",
        "box-sizing": "border-box",
        "border-left": "dashed 1px rgba(0, 0, 0, .2)",
        "border-bottom": "dashed 1px rgba(0, 0, 0, .2)",
      },
      drag: {
        "box-shadow": "-1vw 3vh 0 0 rgba(0, 0, 0, .2)",
      },
    };
    let html = `<style> ul li { margin-left: -5vw; } </style>`+this.sanitizeHTML(this.text);
    return (
      <Draggable debug={this.debug} drag={styles.drag} onDrag={this.handleOnDrag}
        stopDrag={this.onStopDrag} x={this.x} y={this.y} z={this.z}>
        <div style={styles.box}>
          <img src={resolveAsset("paper.png")} style={styles.box} />
          {this.debug && (<div style={styles.text}> {html+this.stamps} </div>)}
          {!this.debug && (<div style={styles.text}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }} />)}
          {!this.debug && (<div style={styles.stamps}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: this.stamps }} />)}
        </div>
      </Draggable>
    );
  }
}

export const InspectorBooth = (props, context) => {
  const { data } = useBackend(context);
  const { debug, items=[] } = data;
  return (
    <Window width={775} height={500} >
      <div class={InspectorBooth} style={`-ms-interpolation-mode: nearest-neighbor;
      background-repeat: space; background-size: 10px 10px;
      background-image: url(${resolveAsset("desk.png")});
      height: 100vh;-ms-user-select: none; user-select: none;`}>
        {items.map(item => (
          <Paperwork debug={debug} key={item.id} id={item.id} text={item.text} stamps={item.stamps} x={item.x} y={item.y} z={item.z} />
        ))}
        <StampTray />
      </div>
    </Window>
  );
};

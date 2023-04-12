/**
 * @file
 * @copyright 2023 Kaithyl (https://github.com/kaithyl)
 * @license MIT
 */

import { Fragment, Component } from 'inferno';
import { resolveAsset } from '../assets';
import { useBackend, useSharedState, useLocalState } from '../backend';
import { Window } from '../layouts';

import { Draggable } from '../components/Draggable';
import DOMPurify from 'dompurify';

// DO NOT REMOVE THIS IS IMPORTANT FOR PREVENTING INJECTION ATTACKS
const sanitizeHTML = (input) => {
  input = DOMPurify.sanitize(input, {
    FORBID_ATTR: ['class', 'style'],
    ALLOWED_TAGS: [
      'br', 'code', 'li', 'p', 'pre', 'span', 'table', 'td', 'tr',
      'th', 'ul', 'ol', 'menu', 'b', 'center', 'table', 'tr', 'th', 'hr',
    ],
  });
  input = input.replace(/\[%f\]/g, `<input type="checkbox" disabled="disabled" />`);
  return input;
};

const overlap = (first, second) => {
  const x = first?.getBoundingClientRect();
  const y = second?.getBoundingClientRect();
  if (x === undefined || y === undefined) { return false; }
  return !(x.left > y.right || x.right < y.left || x.top > y.bottom || x.bottom < y.top);
};

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

  stamp() {
    const { act } = useBackend(this.context);
    if (!this.ref) { return; }
    const papers = document.getElementsByClassName('InspectorBooth__Items__paper');
    if (papers.length <= 0) { return; }
    let paper = null;
    let z = -Infinity;
    for (let i = 0; i < papers.length; i++) {
      if (overlap(this.ref, papers[i]) && papers[i].dataset.z >= z) {
        paper = papers[i];
        z = papers[i].dataset.z;
      }
    }
    if (paper === null) { return; }
    act('stamp_item', { id: paper.dataset.id, type: this.type });
  }

  handleClick() {
    const [active, setActive] = useSharedState(this.context, this.type+"_active", false);
    const [, setTimer] = useSharedState(this.context, this.type+"_timer", new Date().getTime());
    if (active) { return; }
    const { act, config } = useBackend(this.context);
    setActive(true);
    act('play_sfx', { name: 'stamp_down', ckey: config.client?.ckey });
    setTimeout(() => {
      this.stamp();
      setActive(false);
      act('play_sfx', { name: 'stamp_up', ckey: config.client?.ckey });
    }, 500);
    setTimer(new Date().getTime());
  }

  render() {
    const [active] = useSharedState(this.context, this.type+"_active", false);
    const styles = {
      tray_cover : {
        "margin-left": "-1.23vw",
        width:"9.487vw",
      },
      stamp : {
        "margin-left": "-8.27vw",
        width: "6.9vw",
        transition: "transform 150ms ease-out 0s",
      },
      up: { transform: "translateY(0vh)" },
      down: { transform: "translateY(5vh)" },
    };
    return (
      <span>
        <img src={resolveAsset("tray_cover.png")} style={styles.tray_cover} />
        <img className={'InspectorBooth__Tray__stamp'} src={resolveAsset(this.icon)} onClick={this.handleClick}
            ref={ref => (this.ref = ref)} style={{ ...styles.stamp, ...active ? styles.down : styles.up }} />
        {this.debuglog && (<div style={`position: absolute; left: 0; top: 0;`}> {this.debuglog} </div>)}
      </span>
    );
  }
}

class StampTray extends Component {
  constructor(props) {
    super(props);
    this.end_width = 5.145;
    this.slide_width = -31.65;

    // Necessary in ES6
    this.initRef = this.initRef.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
  }

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
    let segs = [];
    for (let i = 0; i < num; i++) {
      segs.push(<img className={'InspectorBooth__Tray__segment'}
        src={resolveAsset("tray_segment.png")} style={`width: 6vw;`} />);
    }
    return segs;
  }

  render() {
    const { data } = useBackend(this.context);
    const { stamps=[] } = data;
    const [active] = useSharedState(this.context, "tray_active", false);
    const [zIndex] = useSharedState(this.context, "zindex", 0);
    const styles = {
      slide : {
        "z-index": zIndex+100,
        transition: this.init ? "transform 300ms ease-in-out 0s" : "none",
      },
      out : { transform: "translateX(0vw)" },
      in : { transform: `translateX(${this.slide_width}vw)` },
      tray_end : {
        width: `${this.end_width}vw`,
        position: "relative",
        "pointer-events": "auto",
      },
    };
    const className = `InspectorBooth__Tray`;
    return (
      <div ref={this.initRef} className={className} style={{ ...styles.slide, ...active ? styles.out : styles.in }}>
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

class Item extends Component {
  constructor(props) {
    super(props);
    this.state = { isSmall: false };
    this.className = props.className;
    this.debug = props.debug;
    this.item_id = props.item_id;
    this.onDrag = {};
    this.x = props.x;
    this.y = props.y;
    this.z = props.z;

    // Necessary in ES6
    this.initRef = this.initRef.bind(this);
    this.startDrag = this.startDrag.bind(this);
    this.duringDrag = this.duringDrag.bind(this);
    this.stopDrag = this.stopDrag.bind(this);
  }

  initRef(ref) {
    this.ref = ref;
    processItem(this.context, this, this.item_id);
  }

  startDrag(e, ref) {
    const { act, config } = useBackend(this.context);
    const [zIndex, setZIndex] = useSharedState(this.context, "zindex", 0);
    const [, setIsDragging] = useLocalState(this.context, "isDragging", false);

    if (this.props.dragVisible) {
      setIsDragging(true);
    }

    setZIndex(prev => prev+1);
    ref.z = zIndex;

    if (this.sfx_startDrag) {
      act('play_sfx', { name: this.sfx_startDrag, ckey: this.useUser ? config.client?.ckey : null });
    }
  }

  duringDrag(e, ref) {
    const { dX } = ref.state;
    this.x = dX;
    let isSmall = dX+100*this.ref.getBoundingClientRect().clientWidth/window.innerWidth >= 70;
    this.setState({ isSmall: isSmall });
    ref.setState({ center: isSmall });
  }

  stopDrag(ref) {
    const { act, config } = useBackend(this.context);
    const { dX, dY } = ref.state;
    const [, setIsDragging] = useLocalState(this.context, "isDragging", false);

    if (this.props.dragVisible) {
      setIsDragging(false);
    }

    act('move_item', { id: this.item_id, x: dX, y: dY, z: ref.z });
    if (this.sfx_stopDrag) {
      act('play_sfx', { name: this.sfx_stopDrag, ckey: this.useUser ? config.client?.ckey : null });
    }

    if (this.ref) {
      processItem(this.context, this, this.item_id);
    }
  }

  render() {
    const { isSmall } = this.state;
    const small = isSmall || this.x >= 70 ? '--small' : '';
    return (
      <Draggable x={this.x} y={this.y} z={this.z} drag={this.onDrag} duringDrag={this.duringDrag}
        startDrag={this.startDrag} stopDrag={this.stopDrag} center={isSmall} debug={this.debug}>
        <div data-id={this.item_id} data-z={this.z} className={this.className+small}
        style={`z-index: ${this.z};`} ref={this.initRef}>
          {this.renderItem && (this.renderItem())}
        </div>
      </Draggable>
    );
  }
}

class Paperwork extends Item {
  constructor(props) {
    super(props);
    this.className = 'InspectorBooth__Items__paper';
    this.onDrag = { "box-shadow": "-1vw 3vh 0 0 rgba(0, 0, 0, .2)" };
    this.useUser = true;
    this.sfx_startDrag = 'drag_start';
    this.sfx_stopDrag = 'drag_stop';

    this.text = props.text ?? " ";
    this.stamps = props.stamps ?? " ";
  }

  processStamps() {
    let stamps = this.stamps.replace(/paper121x121/g, 'InspectorBooth__paper121x121 paper121x121');
    stamps = stamps.replace(/paper120x54/g, 'InspectorBooth__paper120x54 paper120x54');
    stamps = stamps.replace(/paper121x54/g, 'InspectorBooth__paper121x54 paper121x54');
    return stamps;
  }

  renderItem() {
    return (
      <Fragment>
        <img src={resolveAsset("paper.png")} className={this.className+'-icon'} />
        {this.debug && (<div className={this.className+'-textBox'}> {sanitizeHTML(this.text)+this.processStamps()} </div>)}
        {!this.debug && (<div className={this.className+'-textBox'}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: sanitizeHTML(this.text) }} />)}
        {!this.debug && (<div className={this.className+'-stamps'}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: this.processStamps() }} />)}
      </Fragment>
    );
  }
}

const Receptacle = (props, context) => {
  const [isDragging] = useLocalState(context, "isDragging", false);
  const className = 'InspectorBooth__Receptacle';
  return (
    <div className={className+' '+className+'--'+props.type} data-exec={props.type}>
      {isDragging && (props.text) }
    </div>
  );
};

const processItem = (context, item, item_id) => {
  const { act, config } = useBackend(context);
  const bins = document.getElementsByClassName('InspectorBooth__Receptacle');
  for (let i = 0; i < bins.length; i++) {
    if (overlap(item.ref, bins[i])) {
      let result = bins[i].dataset.exec;
      switch (result) {
        case 'take_item':
          act(result, { id: item_id, ckey: config.client?.ckey });
          return;
        case 'drop_item':
          act(result, { id: item_id });
          return;
      }
    }
  }
};

export const InspectorBooth = (props, context) => {
  const { data } = useBackend(context);
  const { debug, items=[] } = data;
  return (
    <Window width={775} height={500} >
      <div className={'InspectorBooth'} style={`background-image: url(${resolveAsset("desk.png")});`}>
        {items.papers?.map(item => (
          <Paperwork removable dragVisible debug={debug===1} item_id={item.id} text={item.text} stamps={item.stamps}
          x={item.x} y={item.y} z={item.z} key={item.id+item.x+item.y+item.z+item.text+item.stamps+debug} />
        ))}
        <StampTray />
        <Receptacle text={"Drag here to eject"} type={'drop_item'} />
        <Receptacle text={"Drag here to take"} type={'take_item'} />
        <Receptacle type={'shrink'} />
      </div>
    </Window>
  );
};

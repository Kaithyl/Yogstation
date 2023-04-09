import { Fragment, Component } from 'inferno';

export class Draggable extends Component {
  constructor(props) {
    super(props);
    this.debug = props.debug;
    this.state = {
      initX: 0, initY: 0,
      dX: 0, dY: 0,
      pX: 0, pY: 0,
    };

    // Necessary in ES6
    this.initRef = this.initRef.bind(this);
    this.handleInitDrag = this.handleInitDrag.bind(this);
    this.startDrag = this.startDrag.bind(this);
    this.stopDrag = this.stopDrag.bind(this);
  }

  initRef(ref) {
    this.ref = ref;
    if (ref && "getBoundingClientRect" in ref) {
      let pos = ref.getBoundingClientRect();
      this.setState({
        initX: "x" in pos ? pos.x : 0,
        initY: "y" in pos ? pos.y : 0,
      });
    }
  }

  handleInitDrag(e) {
    // Ignore if not left click
    if (e.button !== 0) return;
    const { initX, initY } = this.state;
    // Multiply by 100/window size to convert from px to vw/vh
    this.setState({
      pX: e.clientX,
      pY: e.clientY,
      /* dX: 100*(e.clientX - initX - this.ref.clientWidth/2)/window.innerWidth,
      dY: 100*(e.clientY - initY - this.ref.clientHeight/2)/window.innerHeight,*/
    });
    window.addEventListener("mousemove", this.startDrag, false);
    window.addEventListener("mouseup", this.stopDrag, false);
  }

  startDrag(e) {
    const { initX, initY } = this.state;
    this.setState(prev => ({
      dX: 100*(e.clientX - prev.pX + initX)/window.innerWidth,
      dY: 100*(e.clientY - prev.pY + initY)/window.innerHeight,
    }));
  }

  // remove event listeners when the component is not being dragged
  stopDrag() {
    this.setState({
      initX: this.ref.getBoundingClientRect().left,
      initY: this.ref.getBoundingClientRect().top,
    });
    window.removeEventListener("mousemove", this.startDrag, false);
    window.removeEventListener("mouseup", this.stopDrag, false);
  }

  render() {
    const { dX, dY } = this.state;
    const style = {
      position: "absolute",
      transform: `translate(${dX}vw, ${dY}vh)`,
      border: this.debug ? "2px solid rgba(255, 0, 0, 1)" : "none",
    };
    const debug = {
      transform: `translate(${dX}vw, ${dY - 2.5}vh)`,
    };
    let pos = null;
    if (this.debug && this.ref) {
      pos = this.ref.getBoundingClientRect();
    }
    return (
      <Fragment>
        <div style={style} onMouseDown={this.handleInitDrag} ref={this.initRef}>
        { this.props.children }
        </div>
        {pos && <div style={debug}> x: {pos.left}, y: {pos.top} </div>}
      </Fragment>
    );
  }
}

import { Fragment, Component } from 'inferno';

export class Draggable extends Component {
  constructor(props) {
    super(props);
    this.debug = props.debug;
    this.state = {
      initX: 0,
      initY: 0,
      dX: 0,
      dY: 0,
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
    this.setState({
      dX: e.clientX - initX - this.ref.clientWidth / 2,
      dY: e.clientY - initY - this.ref.clientHeight / 2,
    });
    window.addEventListener("mousemove", this.startDrag, false);
    window.addEventListener("mouseup", this.stopDrag, false);
  }

  startDrag(e) {
    const { initX, initY } = this.state;
    this.setState({
      dX: e.clientX - initX - this.ref.clientWidth / 2,
      dY: e.clientY - initY - this.ref.clientHeight / 2,
    });
  }

  // remove event listeners when the component is not being dragged
  stopDrag() {
    window.removeEventListener("mousemove", this.startDrag, false);
    window.removeEventListener("mouseup", this.stopDrag, false);
  }

  render() {
    const { dX, dY } = this.state;
    const style = {
      transform: `translate(${dX}px, ${dY}px)`,
      border: "2px solid rgba(255, 0, 0, 1)",
      width: "10%",
    };
    const debug = {
      transform: `translate(${dX}px, ${dY + 10}px)`,
    };
    let pos = null;
    if (this.debug) {
      pos = (this.ref && typeof this.ref.getBoundingClientRect() === "object") ? this.ref.getBoundingClientRect() : null;
    }
    return (
      <Fragment>
        <span style={style} onMouseDown={this.handleInitDrag} ref={this.initRef}>
        { this.props.children }
        </span>
        {pos && <span style={debug}> x: {pos.x}, y: {pos.y} </span>}
      </Fragment>
    );
  }
}

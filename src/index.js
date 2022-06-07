import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

function Square(props) {
  //具体的框框，由一个win属性的值决定是否能连成一线，值类似[0,1,2]，表示每个点的索引
  return (
    <button
      className={"square " + (props.win ? " win" : " ")}
      onClick={props.onClick}
    >
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i, row, col) {
    //判断这个框框是否满足胜出条件,下面的<Square />可以简化为function Square内的组件
    let isWin = this.props.win.indexOf(i) !== -1 ? true : false;
    return (
      <Square
        key={i}
        value={this.props.squares[i]}
        win={isWin}
        onClick={() => this.props.onClick(i, row, col)}
      />
    );
  }
  //渲染行
  renderRow() {
    const rows = [];
    //字母用于在右侧显示的某一步的坐标，值可能类似A1,B2...
    const letters = ["A", "B", "C"];
    for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
      rows.push(
        <div className="board-row" key={rowIndex}>
          {this.renderCol(letters[rowIndex], rowIndex)}
        </div>
      );
    }
    return rows;
  }
  //渲染列
  renderCol(rowName, rowIndex) {
    const cols = [];
    for (let colIndex = 0; colIndex < 3; colIndex++) {
      cols.push(
        this.renderSquare(rowIndex * 3 + colIndex, rowName, colIndex + 1)
      );
    }
    return cols;
  }

  render() {
    return this.renderRow();
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    //moves为右侧的历史步骤的集合，在构造函数中默认定义第一步
    const moves = [
      <li key={0}>
        1 <button>Go to game start</button>
      </li>,
    ];
    this.state = {
      //历史步骤具体情况的集合
      history: [
        {
          //步骤中每个点的情况
          squares: Array(9).fill(null),
          //该步骤操作的具体坐标
          detail: [],
          //该步骤由X或O操作
          which: "",
          //逻辑上的步骤的索引
          index: 0,
        },
      ],
      //胜出的框框的索引，三个可以连成一线
      winCell: [null, null, null],
      //是否历史步骤翻转排序
      isReverse: false,
      //当前选择的历史步骤的索引
      stepNumber: 0,
      //当前选择的历史步骤的逻辑意义的索引（逻辑上的先后）
      stepIndex: 0,
      //同上 const moves
      moves: moves,
      //X是否是下一步
      xIsNext: true,
    };
  }
  //点击单元格，传入i=单元格索引，row=行索引，col=列索引
  handleClick(i, row, col) {
    //是否翻转
    if (this.state.isReverse) {
      //取当前历史步骤的索引起 至 结尾 的步骤集合
      var history = this.state.history.slice(
        this.state.stepNumber,
        this.state.history.length
      );
      //当前操作的步骤为集合的第一个，即最上面一个
      const current = history[0];
      //复制一个点位到变量squares
      const squares = current.squares.slice();
      //判断是否胜出
      const res = calculateWinner(squares);
      if (res || squares[i]) {
        return;
      }
      //下一步的历史步骤的逻辑索引
      const stepNm = current.index + 1;
      //在历史步骤集合最前方插入这次操作的数据
      squares[i] = this.state.xIsNext ? "X" : "O";

      history.unshift({
        squares: squares,
        detail: [row, col],
        which: squares[i],
        index: stepNm,
      });
      this.setState({
        history: history,
        stepNumber: 0,
        stepIndex: stepNm,
        xIsNext: !this.state.xIsNext,
      });
      //触发更新渲染历史步骤
      this.getHistoryList(history, stepNm);
    } else {
      //如果是正常的升序
      //取历史步骤集合的第0个到，当前步骤索引+1
      const history = this.state.history.slice(0, this.state.stepNumber + 1);
      //取最后一个步骤为当前步骤，即最后一个
      const current = history[history.length - 1];
      //复制点位
      const squares = current.squares.slice();
      //计算是否有一方胜出
      if (calculateWinner(squares) || squares[i]) {
        return;
      }
      //下一步的历史步骤的索引
      const stepNm = current.index + 1;
      //将本次操作添加到历史步骤的队尾
      squares[i] = this.state.xIsNext ? "X" : "O";
      const his = history.concat([
        {
          squares: squares,
          detail: [row, col],
          which: squares[i],
          index: stepNm,
        },
      ]);

      this.setState({
        history: his,
        stepNumber: stepNm,
        stepIndex: stepNm,
        xIsNext: !this.state.xIsNext,
      });
      //触发更新渲染历史步骤
      this.getHistoryList(his, stepNm);
    }
  }
  //点击某一个历史步骤,stepIndex=当前点击的历史步骤集合的索引，newHistory=新集合的列表
  jumpTo(stepIndex, newHistory) {
    //声明一个历史步骤集合的逻辑索引
    var newStepIndex = 0;
    newHistory.map((v, k) => {
      if (k === stepIndex) {
        newStepIndex = v.index;
      }
    });

    this.setState({
      stepNumber: newStepIndex,
      stepIndex: stepIndex,
      xIsNext: stepIndex % 2 === 0,
    });
    //触发更新渲染历史步骤
    this.getHistoryList(newHistory, stepIndex);
  }
  //点击排序
  changeSort() {
    //复制一个历史步骤集合
    let history = this.state.history.slice();
    //上一步的逻辑索引
    let oldIndex = history[this.state.stepNumber].index;
    //翻转历史记录
    const his = history.reverse();
    //获取新的stepNumber（历史步骤列表的当前的索引）
    //而stepIndex则不用改变
    let newIndex = null;
    for (var i = 0; i < his.length; i++) {
      if (his[i].index === oldIndex) {
        newIndex = i;
      }
    }
    this.setState({
      history: his,
      stepNumber: newIndex,
      isReverse: !this.state.isReverse,
    });
    //触发更新渲染历史步骤
    this.getHistoryList(his, this.state.stepIndex);
  }
  //触发更新渲染历史步骤,据目前所知如果要同步获得setState之后state的值，需要使用回调，暂时使用传参来保证数据一致。。。
  //newHistory=历史步骤集合,stepind=当前步骤的逻辑索引
  getHistoryList(newHistory, stepInd) {
    //重新构造moves，即右侧的历史记录列表
    const moves = [];
    newHistory.map((step, move) => {
      //列表的名称
      const desc = step.index
        ? "Go to move #" + step.index
        : "Go to game start";
      //是否是当前列表
      const active = step.index === stepInd ? " active " : " ";
      //此步骤是X还是O
      const which = step.which ? step.which + " : " : "";
      //step.detail是此步骤的具体坐标
      moves.push(
        <li key={step.index} className={active}>
          {step.index + 1}{" "}
          <button
            onClick={() => {
              this.jumpTo(step.index, newHistory);
            }}
          >
            {desc}
          </button>{" "}
          <span>
            {which}
            {step.detail.join(",")}
          </span>
        </li>
      );
    });

    this.setState({
      moves: moves,
    });
  }
  //组件的渲染方法
  render() {
    const history = this.state.history;
    //取当前的步骤
    const current = history[this.state.stepNumber];
    //判断是否胜出
    const winner = calculateWinner(current.squares);
    const moves = this.state.moves;
    //连成一线的单元格索引的集合
    var win = this.state.winCell;
    let status;
    if (winner) {
      win = winner.win;
      status = "Winner: " + winner.name;
    } else {
      //判断是否步数走完了都没有人胜出
      if (this.state.stepIndex === 9) {
        status = "Nobody wins";
      } else {
        status = "Next player: " + (this.state.xIsNext ? "X" : "O");
      }
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board
            win={win}
            squares={current.squares}
            onClick={(i, row, col) => this.handleClick(i, row, col)}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <div>
            <button
              onClick={() => {
                this.changeSort();
              }}
            >
              排序
            </button>
          </div>
          <ul>{moves}</ul>
        </div>
      </div>
    );
  }
}
//官方给的判断胜出的方法，稍作修改
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      //能连成一线的点的索引的集合
      var win = lines[i];
      return { name: squares[a], win: win };
    }
  }
  return null;
}

// ========================================

ReactDOM.render(<Game />, document.getElementById("root"));

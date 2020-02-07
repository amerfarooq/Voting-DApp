import React, {Component} from 'react';
import Web3 from 'web3'
import {VOTING_ADDRESS, VOTING_ABI } from './config.js'
import CanvasJSReact from './canvasjs.react.js';
import { AwesomeButton } from "react-awesome-button";
import 'react-awesome-button/dist/themes/theme-red.css';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import winner from'./winner.png';

var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

class App extends Component {
  constructor() {
    super();
    this.state = {
      account: "",
      contract: "",
      choiceNames: "",
      choiceVotes: "",
      winner: "Voting is still going!"
    };
  }

  componentDidMount() {
    this.loadBlockchainData();
  }

  async loadBlockchainData() {
    const ethereum = window.ethereum;
    await ethereum.enable()

    const web3 = new Web3(Web3.givenProvider);
    // const accounts = await ethereum.enable()
    const accounts = await web3.eth.getAccounts();
    console.log("MetaMask accounts", accounts);
    this.setState({ account: accounts[0] });

    const votingContract = new web3.eth.Contract(VOTING_ABI, VOTING_ADDRESS);
    this.setState({ contract: votingContract });
    console.log(votingContract)

    const allChoices = await votingContract.methods.getAllChoices().call();
    this.setState({ choiceNames: allChoices });
    console.log("Choice names: ", allChoices)

    var choiceVotes = [];
    for (const choice of allChoices) {
      const numOfVotes = await votingContract.methods
        .getChoiceVotes(String(choice))
        .call();
      choiceVotes.push(numOfVotes);
    }
    this.setState({ choiceVotes: choiceVotes });
    console.log("Choice Votes: ", this.state.choiceVotes);

    const winner = await votingContract.methods.getWinner().call();
    this.setState({ winner: winner });
    console.log("Winner: ", winner);
  }

  createChartData() {
    var dataPoints = [];
    for (let i = 0; i < this.state.choiceVotes.length; ++i) {
      dataPoints.push({
        y: parseInt(this.state.choiceVotes[i]),
        label: this.state.choiceNames[i]
      });
    }
    return dataPoints;
  }

  getChartOptions() {
    return {
      animationEnabled: true,
      height: 250,
      theme: "light2",
      title: {
        text: "Vote for your choice!"
      },
      axisX: {
        title: "Choices",
        reversed: true,
        titleFontColor: "red"
      },
      axisY: {
        title: "Total Votes",
        interval: 1,
        titleFontColor: "red"
      },
      data: [
        {
          type: "bar",
          dataPoints: this.createChartData()
        }
      ]
    };
  }

  render() {
    return (
      <div>
        <CanvasJSChart options={this.getChartOptions()} />

        <div>
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <center>
                <h4>
                  Cast your vote! Enter the name of any of the above choices!
                </h4>
                <form
                  noValidate
                  autoComplete="off"
                  onSubmit={event => {
                    event.preventDefault();
                    const choiceName = new FormData(event.target).get(
                      "voteField"
                    );
                    console.log(this.state.account);
                    this.state.contract.methods
                      .vote(choiceName)
                      .send({ from: this.state.account })
                      .catch(console.log);
                    this.loadBlockchainData();
                  }}
                >
                  <TextField
                    id="outlined-basic"
                    label="Choice name"
                    margin="normal"
                    name="voteField"
                    variant="standard"
                    margin="dense"
                    color="secondary"
                  />
                  <AwesomeButton type="primary submit">Vote</AwesomeButton>
                </form>
              </center>
            </Grid>

            <Grid item xs={6}>
              <center>
                <h4>Add a new choice to the election!</h4>
                <form
                  onSubmit={event => {
                    event.preventDefault();
                    const choiceName = new FormData(event.target).get(
                      "addChoiceField"
                    );
                    this.state.contract.methods
                      .addChoice(choiceName)
                      .send({ from: this.state.account })
                      .catch(console.log);
                    this.loadBlockchainData();
                  }}
                >
                  <TextField
                    id="outlined-basic"
                    label="New choice"
                    margin="normal"
                    name="addChoiceField"
                    variant="standard"
                    margin="dense"
                    color="secondary"
                  />
                  <AwesomeButton type="primary submit">Add</AwesomeButton>
                </form>
              </center>
            </Grid>
          </Grid>
        </div>
        <br></br>
        <br></br>
        <br></br>
        <center>
        <img src={winner} height={150} alt="Winner Logo"/>
        </center>
        <center>
        <h2>{this.state.winner}</h2>
        </center>
      </div>
    );
  }
}


export default App;
import axios from "axios";
import React, { Component } from "react";
import {
  bufferCount,
  interval,
  Observable,
  scan,
  skipUntil,
  skipWhile,
  Subscription,
  takeUntil,
  takeWhile,
  tap,
  windowWhen,
} from "rxjs";
export class PointsTable extends React.Component {
  subscription;
  constructor(props) {
    super(props);
    this.state = {
      teams: [],
      match: {},
      possibleScores: [
        0,
        0,
        0,
        1,
        2,
        3,
        3,
        0,
        0,
        1,
        1,
        1,
        2,
        2,
        4,
        6
      ],
      currentScore: 0,
      wicketsDown: 0,
      overs: 0,
      oversCompleted: false,
      battingSide: "",
      bowlingSide: "",
    };
    fetch("http://localhost:8000/teams")
      .then((res) => res.json())
      .then((res) => {
        this.setState({ teams: res });
      });
  }
  setTeam1(e) {
    let match = this.state.match;
    match.defendingTeam = e.target.value;
    this.setState({ match });
    this.setState({ defendingTeam: e.target.value });
  }
  setTeam2(e) {
    let match = this.state.match;
    match.chasingTeam = e.target.value;
    this.setState({ match });
    this.setState({ chasingTeam: e.target.value });
  }
  startMatch(e) {
    this.startOvers();
    interval(100)
      .pipe(
        tap((a) =>
          this.setState({ overs: Number(this.state.overs.toFixed(1)) + 0.1 })
        ),
        scan((total, curr) => total + this.state.possibleScores[Math.floor(Math.random() * 6)] ),
        takeWhile(() => Number(this.state.overs < 20))
      )
      .subscribe((res) => {
        this.setState({ currentScore: res });
      });
    let int = setInterval(() => {}, 600);
  }
  startOvers() {
    this.subscription = interval(600)
      .pipe(takeWhile(() => this.state.match.winningTeam == null))
      .subscribe((res) => {
        this.getOvers();
      });
  }
  getOvers() {
    if (Number(this.state.overs) < 20) {
      this.setState({ overs: Number(this.state.overs.toFixed(1)) + 0.4 });
    } else {
      if (!this.state.match.defendingScore) {
        let match = this.state.match;
        match.defendingScore = this.state.currentScore;
        this.setState({ match });
        this.setState({ currentScore: 0 });
        this.setState({ overs: 0 });
        this.startMatch();
      } else {
        let match = this.state.match;
        match.chasingScore = this.state.currentScore;
        this.setState({ match });
        if (this.state.match.defendingScore > this.state.match.chasingScore) {
          match.winningTeam = this.state.match.defendingTeam;
          match.losingTeam = this.state.match.chasingTeam;
          axios.post("http://localhost:8000/matches", this.state.match);
          axios.get("http://localhost:8000/teams").then((res) => {
            res.data.find(
              (team) => team.name === this.state.match.winningTeam
            ).points += 2;
            res.data.find(
              (team) => team.name === this.state.match.winningTeam
            ).won += 1;
            res.data.find(
              (team) => team.name === this.state.match.winningTeam
            ).played += 1;
            let winningId = res.data.find(
              (team) => team.name === this.state.match.winningTeam
            ).id;
            axios.put(
              "http://localhost:8000/teams/" + winningId,
              res.data.find(
                (team) => team.name === this.state.match.winningTeam
              )
            );
          });
          axios.get("http://localhost:8000/teams").then((res) => {
            this.setState({ teams: res.data });
            window.location.reload();
          });
        } else {
          match.winningTeam = this.state.match.chasingTeam;
          match.losingTeam = this.state.match.defendingTeam;
          axios.post("http://localhost:8000/matches", this.state.match);
          axios.get("http://localhost:8000/teams").then((res) => {
            res.data.find(
              (team) => team.name === this.state.match.winningTeam
            ).points += 2;
            res.data.find(
              (team) => team.name === this.state.match.winningTeam
            ).won += 1;
            res.data.find(
              (team) => team.name === this.state.match.winningTeam
            ).played += 1;
            let winningId = res.data.find(
              (team) => team.name === this.state.match.winningTeam
            ).id;
            axios.put(
              "http://localhost:8000/teams/" + winningId,
              res.data.find(
                (team) => team.name === this.state.match.winningTeam
              )
            );
          });
          axios.get("http://localhost:8000/teams").then((res) => {
            this.setState({ teams: res.data });
            window.location.reload();
          });
        }
        this.setState({ match });
      }
    }
  }
  wicketDown() {
    let wd = this.state.match;
    wd.wicketsDown = wd.wicketsDown+=1;
    this.setState({ wd });
  }

  render() {
    return (
      <div className="points-table">
        <div className="select-match">
          <select
            placeholder="Select Team 1"
            name="Batting Team"
            id="battingTeam"
            onChange={this.setTeam1.bind(this)}
          >
            {this.state.teams.map((team) => (
              <option value={team.name} id={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <select
            placeholder="Select Team 2"
            name="Batting Team"
            id="bowlingTeam"
            onChange={this.setTeam2.bind(this)}
          >
            {this.state.teams.map((team) => (
              <option
                value={team.name}
                id={team.id}
                disabled={
                  team.name === this.state.match.defendingTeam ? true : false
                }
              >
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <div className="start-match">
          <button onClick={this.startMatch.bind(this)}>Start Match</button>
        </div>
        <div className="score-board">
          <div className="batting-side">
            <p>
              {this.state.match.battingSide} {this.state.currentScore} -{" "}
              {this.state.wicketsDown}
            </p>
            <p className="overs">Overs {this.state.overs.toFixed(1)}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Standings</th>
              <th>Team Name</th>
              <th>Played</th>
              <th>Won</th>
              <th>Lost</th>
              <th>Points</th>
              <th>RR</th>
            </tr>
          </thead>
          <tbody>
            {this.state.teams.map((team) => (
              <tr>
                <td> {team.standings} </td>
                <td> {team.name} </td>
                <td> {team.played} </td>
                <td> {team.won} </td>
                <td> {team.lost} </td>
                <td> {team.points} </td>
                <td> {team.rr} </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

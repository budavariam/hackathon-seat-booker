import { useReducer, useEffect } from "react";
import { floors, seatSize, seatState } from "./const";
import useFetch from 'use-http';
import styles from "./SeatBook.module.css";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const Floor = ({ data, dispatch }) => {
    const imagePath = data.selectedFloor.imagePath
    const seats = data.selectedFloor.seats
    const floorName = data.selectedFloor.name
    const imageDim = data.selectedFloor.imageDim
    const selectedSeat = data.selectedSeat

    return <div className={styles.floor}>
        <h1>{floorName}</h1>
        <div
            className={styles["seat-container"]}
            style={{
                backgroundImage: `url(${imagePath})`,
                width: imageDim[0],
                height: imageDim[1],
            }}>
            {seats.map((seat) => {
                const currSeatState = selectedSeat?.id === seat.id
                    ? seatState.SELECTED
                    : seat.state
                return (<div
                    key={seat.id}
                    className={[styles.seat, styles[currSeatState]].join(" ")}
                    title={seat.id}
                    style={{
                        top: seat.coord[1] - seatSize[0] / 2,
                        left: seat.coord[0] - seatSize[1] / 2,
                        height: seatSize[0],
                        width: seatSize[1],
                    }}
                    onClick={() => { dispatch({ type: DISPATCH_ACTION.SELECT_SEAT, seat: { ...seat, floor: data.name } }) }}>
                </div>
                )
            })}
        </div>
    </div>
}

const DISPATCH_ACTION = {
    SELECT_FLOOR: "SELECT_FLOOR",
    SELECT_SEAT: "SELECT_SEAT",
    SELECT_DATE: "SELECT_DATE",
    INITIALIZE: "INITIALIZE",
    FINALIZE_SELECTION: "FINALIZE_SELECTION",
}

const seatBookReducer = (state, action) => {
    if (!action || !action.type) {
        return state
    }
    switch (action.type) {
        case DISPATCH_ACTION.SELECT_FLOOR: {
            return { ...state, selectedFloor: action.floor, selectedSeat: action.floor.name === state.selectedFloor.name ? state.selectedSeat : null }
        }
        case DISPATCH_ACTION.SELECT_SEAT: {
            if (action.seat.state === seatState.BOOKED) {
                return state
            }
            const selectedSeat = action.seat.id === state?.selectedSeat?.id ? null : action.seat
            return { ...state, selectedSeat }
        }
        case DISPATCH_ACTION.SELECT_DATE: {
            return { ...state, selectedDate: action.date }
        }
        case DISPATCH_ACTION.INITIALIZE: {
            return { ...state, ...action.state }
        }
        case DISPATCH_ACTION.FINALIZE_SELECTION: {
            const { selectedSeat, success } = action
            const newFloor = {
                ...state.selectedFloor,
                seats: state.selectedFloor.seats.map(s => {
                    if (selectedSeat.id === s.id) {
                        return {
                            ...s,
                            state: success
                                ? seatState.BOOKED
                                : seatState.EMPTY
                        }
                    }
                    return s
                })
            }
            return {
                ...state,
                selectedFloor: newFloor,
                selectedSeat: success
                    ? null // clear selected seat on success
                    : state.selectedSeat
            }
        }
        default: {
            return state
        }
    }
}

const SeatBook = () => {
    const [state, dispatch] = useReducer(seatBookReducer, {
        selectedDate: new Date(),
        selectedFloor: null,
        selectedSeat: null,
    })
    const { get, post, response, loading, error } = useFetch('https://example.com')
    useEffect(() => { initializeState() }, [
    ])

    async function initializeState() {
        // const data = await get('/seats')
        // if (response.ok) {
        dispatch({
            type: DISPATCH_ACTION.INITIALIZE, state: {
                selectedFloor: floors[0],
                selectedSeat: null,
                selectedDate: new Date(),
            }
        })
        // }
    }

    async function submitData(data) {
        const { selectedFloor, selectedSeat, selectedDate } = data
        console.log("SUBMIT DATA", data)
        // const newTodo = await post('/seats', { selectedFloor, selectedSeat, selectedDate })
        const success = true // response.ok
        dispatch({ type: DISPATCH_ACTION.FINALIZE_SELECTION, success: success, selectedSeat })
    }


    return (<>
        {!state.selectedFloor
            ? 'Loading...'
            : <div className="seatbooker">
                <div>
                    <DatePicker
                        className={styles.seatbookdate}
                        selected={state.selectedDate}
                        onChange={(date) => dispatch({ type: DISPATCH_ACTION.SELECT_DATE, date })}
                        placeholderText="Book Date"
                        dateFormat="yyyy-MM-dd"
                        popperPlacement="top-start"
                        minDate={new Date()}
                    />
                </div>
                <div className={styles.header}>
                    Select floor: {floors.map((floor) => {
                        return (
                            <button key={floor.name} className="button" onClick={() => dispatch({ type: DISPATCH_ACTION.SELECT_FLOOR, floor })}>{floor.name}</button>
                        )
                    })}
                    <button
                        disabled={!state.selectedSeat}
                        className={["button", styles.submitbtn].join(" ")}
                        onClick={() => submitData(state)}
                    >
                        BOOK SEAT
                    </button>
                </div>
                <Floor data={state} dispatch={dispatch} />
            </div>
        }
    </>)
}

export default SeatBook
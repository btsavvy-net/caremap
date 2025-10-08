import React from "react";
import CalendarStrip from "react-native-calendar-strip";
import moment from "moment";
import palette from "@/utils/theme/color";

interface CalendarProps {
  selectedDate: moment.Moment;
  onDateSelected: (date: moment.Moment) => void;
  markedDates?: string[];
}

const TrackCalendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelected,
  markedDates = [],
}) => {

  return (
    <CalendarStrip
      scrollable
      style={{ height: 120, paddingTop: 10, paddingBottom: 10 }}
      calendarColor={palette.primary}
      startingDate={moment().subtract(3, "days")}
      calendarHeaderStyle={{ color: palette.whiteColor, fontSize: 16 }}
      dateNumberStyle={{ color: palette.whiteColor, fontSize: 16 }}
      dateNameStyle={{ color: palette.whiteColor, fontSize: 12 }}
      highlightDateContainerStyle={{
         borderWidth: 1,
  borderColor: palette.whiteColor, 
  borderRadius: 999,
  padding: 5,
  backgroundColor: "transparent", 
      }}
      highlightDateNumberStyle={{
        color: palette.whiteColor,
        fontWeight: "bold",
      }}
      highlightDateNameStyle={{ color: "white", fontSize: 12 }}
      selectedDate={selectedDate}
      onDateSelected={onDateSelected}
      
      iconContainer={{ flex: 0.05 }} // keep spacing small
  iconStyle={{ tintColor: palette.whiteColor }}
    />
  );
};

export default TrackCalendar;

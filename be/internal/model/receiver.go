
package model

import (
	"fmt"
	"github.com/xuri/excelize/v2"
)

type Receiver struct {
  Name  string `json:"name"`
  Owner string `json:"owner"`
  Email string `json:"email"`
  TaxID string `json:"tax_id"`
}

func (m *Receiver) PrintReceiver() {
  fmt.Println("Name:", m.Name)
  fmt.Println("Owner:", m.Owner)
  fmt.Println("Email:", m.Email)
  fmt.Println("TaxID:", m.TaxID)
}

const sheetName = "MainSheet"

func GetReceiverFromSource(filepath string) ([]*Receiver, error) {
	f, err := excelize.OpenFile(filepath)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer func() {
		// Close the spreadsheet.
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	// Get all the rows in the Sheet2.
	rows, err := f.GetRows(sheetName)
  // Protectect that the first two rows are handlers
  if err != nil {
    fmt.Println(err)
    return nil, err
  }
  if len(rows) < 2 {
    fmt.Println("Not enough rows in the sheet")
    return nil, fmt.Errorf("not enough rows in the sheet")
  }
	rows = rows[1:]
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	var receivers []*Receiver
	for _, row := range rows {
		var receiver Receiver
		receiver.Name = row[0]
		receiver.Owner = row[1]
		receiver.Email = row[2]
		receiver.TaxID = row[3]
		receivers = append(receivers, &receiver)
		fmt.Println()
	}
	return receivers, nil
}

func (m *Receiver) GetReceiverAsJSON() string {
  return fmt.Sprintf(`{"name": "%s", "owner": "%s", "email": "%s", "tax_id": "%s"}`, m.Name, m.Owner, m.Email, m.TaxID)
}

func EncodeReceiversToJSON(receivers []*Receiver) string {
  var jsonStr string
  for i, receiver := range receivers {
    jsonStr += receiver.GetReceiverAsJSON()
    if i < len(receivers)-1 {
      jsonStr += ", "
    }
  }
  return "[" + jsonStr + "]"
}
